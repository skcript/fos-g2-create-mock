// Proxy to FeatureOS create-post API.
// Docs: https://developers.featureos.app/docs/posts/create-post
// Browser never talks to FeatureOS directly — the API key passes through here,
// keeping it out of CORS / client logs and letting us shape the request.

const FEATUREOS_URL = "https://api.featureos.app/api/v3/feature_requests";

function mask(v) {
  return v && v.length > 8 ? v.slice(0, 4) + "..." + v.slice(-4) : v;
}

// Build the equivalent curl so the UI can render it as live docs.
// Auth via API-KEY (org-level) or Authorization JWT (user-specific SSO).
function buildCurl({ apiKey, jwt, body }) {
  const lines = [
    `curl -X POST '${FEATUREOS_URL}' \\`,
    `  -H 'API-KEY: ${apiKey ? mask(apiKey) : "YOUR_API_KEY"}' \\`,
  ];
  if (jwt) lines.push(`  -H 'Authorization: Bearer ${mask(jwt)}' \\`);
  lines.push(`  -H 'Content-Type: application/json' \\`);
  lines.push(`  -d '${JSON.stringify(body)}'`);
  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey, jwt, title, description, bucket_id, tag_ids, state_id } = req.body || {};

  if (!apiKey) {
    return res.status(400).json({ error: "Missing FeatureOS API key" });
  }
  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }
  if (!bucket_id) {
    return res.status(400).json({ error: "Missing bucket_id (board id)" });
  }

  // Only forward defined fields.
  const body = { title, bucket_id: Number(bucket_id) };
  if (description) body.description = description;
  if (Array.isArray(tag_ids) && tag_ids.length) body.tag_ids = tag_ids;
  if (state_id) body.state_id = Number(state_id);

  const curl = buildCurl({ apiKey, jwt, body });

  const headers = {
    "API-KEY": apiKey,
    "Content-Type": "application/json",
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  try {
    const upstream = await fetch(FEATUREOS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data, curl });
    }

    return res.status(200).json({ data, curl });
  } catch (err) {
    return res.status(502).json({ error: String(err), curl });
  }
}
