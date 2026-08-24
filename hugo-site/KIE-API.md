# Kie.ai API — verified reference

Everything here was **confirmed live against the API on 2026-08-22** with this
project's key, not taken from a blog post. Where the docs and the live API
disagreed, the live API won.

## Base URL and auth

```
POST  https://api.kie.ai/api/v1/jobs/createTask
GET   https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
GET   https://api.kie.ai/api/v1/chat/credit          → remaining credits
```

```
Authorization: Bearer $KIE_API_KEY
Content-Type: application/json
```

There is **no public model-list endpoint** — `/models`, `/jobs/models` and
`/market/models` all 404. The only way to validate a slug is to call
`createTask` with it.

## The Seedream 5 finding

**"Seedream 5.0 Pro" is not callable on this account.** Kie markets it on their
site, but every plausible slug returns
`422 · "The model name you specified is not supported"`:

| Slug tried | Result |
|---|---|
| `bytedance/seedream-v5-pro` | ✗ 422 |
| `bytedance/seedream-5-pro` | ✗ 422 |
| `bytedance/seedream-v5-0-pro` | ✗ 422 |
| `bytedance/seedream-5-0-pro` | ✗ 422 |
| `bytedance/seedream-v5` | ✗ 422 |
| `bytedance/seedream-v5-edit` | ✗ 422 |
| `seedream/5-pro` | ✗ 422 |
| `bytedance/seedream-v4-5` | ✗ 422 |
| `bytedance/seedream-v4-5-edit` | ✗ 422 |
| **`bytedance/seedream-v4-edit`** | **✓ valid** |
| **`bytedance/seedream-v4-text-to-image`** | **✓ valid** |
| `bytedance/seedream` | ✓ valid (3.0, text-to-image only) |

Possible reasons: v5 is UI/playground-only, gated to a plan tier this key isn't
on, or uses a slug that isn't guessable. **Ask Kie support for the exact v5
slug** if you want it — if they give you one, only `KIE_IMAGE_MODEL` changes.

**`bytedance/seedream-v4-edit` is what we use.** It is the newest Seedream *edit*
model the API accepts, and edit-with-reference is the capability the hero needs.

## Seedream 4.0 Edit — schema

```json
POST /api/v1/jobs/createTask
{
  "model": "bytedance/seedream-v4-edit",
  "callBackUrl": "https://…",          // optional; omit and poll instead
  "input": {
    "prompt": "string, max 5000 chars, REQUIRED",
    "image_urls": ["https://…"],        // REQUIRED, max 10, URLs not base64
    "image_size": "square_hd",          // default square_hd
    "image_resolution": "2K",           // 1K | 2K | 4K, default 1K
    "max_images": 1,                    // 1–6, default 1
    "seed": 80960659,                   // optional — USE IT, see below
    "nsfw_checker": false
  }
}
```

`image_size`: `square` · `square_hd` · `portrait_4_3` · `portrait_3_2` ·
`portrait_16_9` · `landscape_4_3` · `landscape_3_2` · `landscape_16_9` ·
`landscape_21_9`

**Reference images must be publicly reachable URLs.** The API fetches them; it
does not accept base64 or multipart uploads. Accepted: jpeg/png/webp, max 30MB.
Our source files are local, so they need hosting first — see *Getting the
reference image to a URL* below.

**`seed` is the important one.** This is what ChatGPT could not give us. Recipe
rule 4: generate the start frame, note the seed, then generate the end frame with
**the same seed** and only the state clause changed. The seed holds all the detail
you never described — the exact micro-texture, the precise gradient falloff — and
those are exactly the parts that drifted between our first two frames.

### Response

```json
// createTask
{"code":200,"msg":"success","data":{"taskId":"fa508df…","recordId":"fa508df…"}}

// recordInfo — poll this
{"code":200,"msg":"success","data":{
  "taskId":"fa508df…", "model":"bytedance/seedream",
  "state":"waiting",              // waiting → success | fail
  "resultJson":"",                // JSON *string*, parse it: {"resultUrls":[...]}
  "failCode":null, "failMsg":null,
  "creditsConsumed":3.5, "costTime":null, "completeTime":null
}}
```

`resultJson` is a **JSON-encoded string**, not an object — parse it twice.

## Costs, measured

A Seedream 3.0 job cost **3.5 credits**. Balance was 1080 at the start of this
session. Two stray probe jobs cost 3.5 total.

**Probing slugs costs money if the input is valid.** To test a slug safely, send
input the schema will reject — e.g. omit `image_urls` for an edit model. A bad
slug 422s before billing; a good slug with bad input 500s before billing. Only a
good slug with valid input actually submits.

## Getting the reference image to a URL

`image_urls` needs public URLs and our stills are local. Options:

1. **`cloudflared tunnel --url http://localhost:8080`** over a local static
   server. Zero signup, ephemeral, fine for a few generations.
2. **Any object store** (S3/R2/Supabase) with a public read URL.
3. **Kie's own upload endpoint**, if your account exposes one — not documented
   in the market quickstart, worth asking support.

Option 1 is the least setup for this job.

## Prompt implications for Seedream vs GPT-image

The prompts in `media/PROMPTS.md` were written for ChatGPT/GPT-image and need
rework for Seedream:

- **Seedream has a real seed.** Lock it across the pair. This alone should fix
  the background-colour drift we measured.
- **Seedream is less conversational.** GPT-image tolerates "Edit the attached
  photograph. REMOVE: the hand…". Seedream responds better to direct declarative
  description of the *target* image, with the edit instruction stated once.
- **`image_resolution: "2K"`** gets closer to the 2048px the recipe's output
  contract wants. 4K if credits allow.
- **`image_size: "square_hd"`** matches our 1:1 framing.
- Negatives are less reliably honoured than in GPT-image; put the critical
  constraints in the positive prompt instead ("flat unshaded lilac background"
  beats "no gradient").
