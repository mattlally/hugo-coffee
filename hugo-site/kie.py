#!/usr/bin/env python3
"""Kie.ai driver for the Hugo hero stills.

Upload a local image, run a Seedream edit against it, poll, download the result.
Stdlib only — no pip install.

  ./kie.py credits
  ./kie.py upload media/start.png
  ./kie.py edit  --image media/start.png --prompt-file media/p1.txt --out media/start_v2.png
  ./kie.py edit  --image media/start_v2.png --prompt-file media/p2.txt \
                 --out media/end_v2.png --seed 12345

The seed is the point. Run the start frame, note the seed it reports, then pass
that same --seed to the end frame so only the state clause differs between them
(recipe rule 4). That is what stops the background and framing drifting.
"""
import argparse, base64, json, mimetypes, os, sys, time, urllib.error, urllib.request

UPLOAD_URL = "https://kieai.redpandaai.co/api/file-base64-upload"   # NOT api.kie.ai
CREATE = "/jobs/createTask"
RECORD = "/jobs/recordInfo"
CREDIT = "/chat/credit"


def env(name, default=None, required=False):
    v = os.environ.get(name, default)
    if required and not v:
        sys.exit(f"error: {name} not set. Is .env populated?")
    return v


def load_dotenv(path=".env"):
    here = os.path.dirname(os.path.abspath(__file__))
    p = os.path.join(here, path)
    if not os.path.exists(p):
        return
    for line in open(p):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())


def req(url, payload=None, method=None, timeout=120):
    key = env("KIE_API_KEY", required=True)
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(
        url, data=data, method=method or ("POST" if data else "GET"),
        headers={"Authorization": f"Bearer {key}",
                 "Content-Type": "application/json",
                 # Cloudflare in front of the upload host rejects Python's default
                 # "Python-urllib/3.x" UA with 403 error 1010. Any ordinary UA passes.
                 "User-Agent": "curl/8.7.1"})
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        sys.exit(f"HTTP {e.code} from {url}\n{body}")
    except urllib.error.URLError as e:
        sys.exit(f"network error calling {url}: {e.reason}")


def api(path, payload=None, method=None):
    base = env("KIE_BASE_URL", "https://api.kie.ai/api/v1").rstrip("/")
    return req(base + path, payload, method)


# ── commands ──────────────────────────────────────────────────────────────

def cmd_credits(_):
    r = api(CREDIT)
    print(f"{r.get('data')} credits")


def upload(path, max_bytes=900_000):
    """Upload a local file, return its public URL. Free; deleted after 3 days.

    The endpoint sits behind Cloudflare and rejects large bodies with a 403
    (error 1010). Base64 inflates by ~33%, so a 1.4MB PNG becomes ~1.9MB and
    fails. Anything over max_bytes is transcoded to JPEG at full pixel
    dimensions first — Seedream only needs the pixels as a visual reference,
    so JPEG here costs nothing that matters.
    """
    if not os.path.exists(path):
        sys.exit(f"error: no such file: {path}")

    send, tmp = path, None
    if os.path.getsize(path) > max_bytes:
        import subprocess, tempfile
        tmp = os.path.join(tempfile.gettempdir(), "kie_" + os.path.basename(path) + ".jpg")
        for q in (3, 6, 9):
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path,
                            "-q:v", str(q), tmp], check=True)
            if os.path.getsize(tmp) <= max_bytes:
                break
        send = tmp
        print(f"  transcoded {os.path.getsize(path)/1e6:.1f}MB PNG "
              f"-> {os.path.getsize(send)/1e3:.0f}KB JPEG for upload")

    mime = mimetypes.guess_type(send)[0] or "image/png"
    b64 = base64.b64encode(open(send, "rb").read()).decode()
    try:
        r = req(UPLOAD_URL, {
            "base64Data": f"data:{mime};base64,{b64}",
            "uploadPath": "hugo/hero",
            "fileName": os.path.basename(send),
        })
    finally:
        if tmp and os.path.exists(tmp):
            os.remove(tmp)
    if not r.get("success"):
        sys.exit(f"upload failed: {r}")
    return r["data"]["downloadUrl"]


def cmd_upload(a):
    print(upload(a.path))


def poll(task_id, every=5, limit=600):
    """Poll until the task leaves 'waiting'. Returns the parsed result URLs."""
    waited = 0
    while waited < limit:
        d = api(f"{RECORD}?taskId={task_id}")["data"]
        state = d.get("state")
        if state == "success":
            # resultJson is a JSON-encoded STRING, not an object
            inner = json.loads(d.get("resultJson") or "{}")
            urls = inner.get("resultUrls") or []
            print(f"  done in {d.get('costTime')}s, {d.get('creditsConsumed')} credits")
            return urls
        if state in ("fail", "failed", "error"):
            sys.exit(f"task failed [{d.get('failCode')}]: {d.get('failMsg')}")
        time.sleep(every)
        waited += every
        print(f"  …{state} ({waited}s)", flush=True)
    sys.exit(f"timed out after {limit}s. Task {task_id} may still finish; "
             f"check with: ./kie.py status {task_id}")


def cmd_status(a):
    d = api(f"{RECORD}?taskId={a.task_id}")["data"]
    print(json.dumps(d, indent=2)[:1500])


def download(url, dest):
    os.makedirs(os.path.dirname(os.path.abspath(dest)), exist_ok=True)
    # Same Cloudflare UA rule as the upload host — see req().
    rq = urllib.request.Request(url, headers={"User-Agent": "curl/8.7.1"})
    with urllib.request.urlopen(rq, timeout=180) as r, open(dest, "wb") as f:
        f.write(r.read())
    print(f"  saved {dest} ({os.path.getsize(dest)/1e6:.2f}MB)")


def cmd_edit(a):
    prompt = open(a.prompt_file).read().strip() if a.prompt_file else a.prompt
    if not prompt:
        sys.exit("error: pass --prompt or --prompt-file")
    if len(prompt) > 5000:
        sys.exit(f"error: prompt is {len(prompt)} chars, max 5000")

    print(f"uploading {a.image} …")
    url = upload(a.image)
    print(f"  {url}")

    inp = {
        "prompt": prompt,
        "image_urls": [url],
        "image_size": a.size,
        "image_resolution": a.resolution,
        "max_images": 1,
    }
    if a.seed is not None:
        inp["seed"] = a.seed
        print(f"  seed locked to {a.seed}")

    model = env("KIE_IMAGE_MODEL", "bytedance/seedream-v4-edit")
    print(f"submitting to {model} …")
    r = api(CREATE, {"model": model, "input": inp})
    if r.get("code") != 200:
        sys.exit(f"createTask failed: {r.get('msg')}")
    task = r["data"]["taskId"]
    print(f"  task {task}")
    # Persist immediately. There is no job-history endpoint on this API, so a
    # crash between here and download() would strand a paid-for result with no
    # way to find its id again.
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".kie-tasks.log"), "a") as fh:
        fh.write(f"{int(time.time())}\t{task}\t{a.out}\tseed={a.seed}\n")

    urls = poll(task)
    if not urls:
        sys.exit("task succeeded but returned no images")
    for i, u in enumerate(urls):
        dest = a.out if len(urls) == 1 else f"{os.path.splitext(a.out)[0]}_{i}.png"
        download(u, dest)

    # Surface the seed so the sibling frame can reuse it.
    d = api(f"{RECORD}?taskId={task}")["data"]
    try:
        used = json.loads(json.loads(d.get("param") or "{}").get("input") or "{}").get("seed")
    except Exception:
        used = None
    print()
    if used is not None:
        print(f"SEED USED: {used}   ← pass --seed {used} to the sibling frame")
    elif a.seed is None:
        print("NOTE: no seed was set and none was reported. For the end frame, set an\n"
              "      explicit --seed on BOTH frames so they share one.")


def main():
    load_dotenv()
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("credits").set_defaults(fn=cmd_credits)

    u = sub.add_parser("upload"); u.add_argument("path"); u.set_defaults(fn=cmd_upload)

    s = sub.add_parser("status"); s.add_argument("task_id"); s.set_defaults(fn=cmd_status)

    e = sub.add_parser("edit", help="edit an image with a reference prompt")
    e.add_argument("--image", required=True, help="local source image")
    e.add_argument("--prompt")
    e.add_argument("--prompt-file")
    e.add_argument("--out", required=True, help="where to save the result")
    e.add_argument("--seed", type=int, help="lock the seed — use the SAME value on both frames")
    e.add_argument("--size", default="square_hd",
                   help="square|square_hd|portrait_4_3|portrait_3_2|portrait_16_9|"
                        "landscape_4_3|landscape_3_2|landscape_16_9|landscape_21_9")
    e.add_argument("--resolution", default="2K", choices=["1K", "2K", "4K"])
    e.set_defaults(fn=cmd_edit)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
