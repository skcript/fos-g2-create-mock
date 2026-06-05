# G2 → FeatureOS

Next.js (Pages Router) demo. Lists feature asks pulled from G2 reviews and pushes
each into FeatureOS as a post via a server-side proxy.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

## How it works

- `pages/index.js` — home page. Lists mock G2 review posts (`data/g2Posts.js`).
  Inputs for **FeatureOS API key** + **bucket id**. Each post has a
  **Create in FeatureOS** button.
- `pages/api/featureos/create-post.js` — proxy. Browser → this route → FeatureOS
  `POST /api/v3/feature_requests`. Keeps the API key off the client/CORS path and
  returns the equivalent **cURL** so the UI renders it as live docs.

Ref: https://developers.featureos.app/docs/posts/create-post

## Notes

- API key is `password`-typed and sent only to the local proxy.
- The cURL shown in the UI masks the key (first/last 4 chars).
- G2 data is mock; swap `data/g2Posts.js` for a real G2 reviews fetch.
