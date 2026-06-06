# G2 → FeatureOS

A small Next.js (Pages Router) demo that shows how to turn **G2 review feedback
into FeatureOS posts**. It renders a list of mock G2 reviews — each one a feature
ask from a customer — and lets you push any of them into FeatureOS as a feature
request with a single click.

The point of the project is to demonstrate the **integration pattern**, not the
G2 scraping: a browser UI that collects credentials, a server-side proxy that
holds the real call to FeatureOS, and a live cURL panel that documents exactly
what request went out.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

In the UI:

1. Paste your **FeatureOS API key** and a **bucket id** (board id).
2. Optionally generate an **SSO → JWT** token (SSO key + email).
3. Click **Create in FeatureOS** on any G2 review.

All inputs are saved to `localStorage` so they preload on refresh.

## Where the FeatureOS API call happens

The browser **never** calls FeatureOS directly. Every call goes through a local
Next.js **edge** API route that acts as a proxy. This keeps secrets off the
client/CORS path and lets the server shape the request.

### 1. Create a post — `pages/api/featureos/create-post.js`

This is where the actual FeatureOS write happens.

- **Endpoint called:** `POST https://api.featureos.app/api/v3/feature_requests`
- **Runtime:** edge (`export const config = { runtime: "edge" }`)
- **Flow:** `pages/index.js` → `fetch("/api/featureos/create-post")` → this route
  → `fetch(FEATUREOS_URL)` → response relayed back to the browser.
- **Auth headers sent upstream:**
  - `API-KEY: <your key>` — always sent.
  - `Authorization: Bearer <jwt>` — added only when a JWT was generated.
- **Body:** `{ title, bucket_id, description, ... }` — only defined fields are
  forwarded.
- **Docs output:** the route builds the full equivalent cURL (real headers +
  pretty-printed JSON body) and returns it as `curl`. The UI renders it under
  each post so you can see exactly what was sent.

Request reference:
https://developers.featureos.app/docs/posts/create-post

### 2. Generate an SSO JWT — `pages/api/featureos/generate-jwt.js`

Optional. Signs a FeatureOS SSO token server-side so the SSO secret never
reaches the browser.

- **Runtime:** edge — uses Web Crypto (`crypto.subtle`), not Node `crypto`.
- **Algorithm:** `HS256`, mirroring
  `jwt.sign({ email, name }, SSO_KEY, { algorithm: "HS256" })`.
- **Input:** `{ ssoKey, email, name }` → **Output:** `{ token, payload }`.

SSO reference:
https://help.featureos.app/en/articles/setting-up-single-sign-on-for-your-featureos-portal/

## Project layout

| Path | Purpose |
|------|---------|
| `pages/index.js` | Home page — credential inputs, G2 review list, create buttons, cURL/JWT panels |
| `pages/api/featureos/create-post.js` | Edge proxy → FeatureOS create-post (**the API call**) |
| `pages/api/featureos/generate-jwt.js` | Edge route → HS256 SSO JWT signer |
| `data/g2Posts.js` | Mock G2 reviews (swap for a real G2 reviews fetch) |
| `styles/globals.css` | Styling |

## Notes

- API key / SSO key inputs are `password`-typed and sent only to the local proxy.
- The cURL shown in the UI is the **full** command (real values) — convenient as
  copy-paste docs, but it does print secrets on screen.
- Credentials persist in `localStorage`. Handy for a demo; secrets in
  `localStorage` are exposed to any XSS, so don't use real production keys here.
  Use **Clear saved values** to wipe them.
- G2 data is mock; replace `data/g2Posts.js` with a real G2 reviews source.
