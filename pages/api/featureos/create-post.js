// Proxy to FeatureOS create-post API. Edge runtime.
// Docs: https://developers.featureos.app/docs/posts/create-post
// Browser never talks to FeatureOS directly — the API key passes through here,
// keeping it out of CORS / client logs and letting us shape the request.
export const config = { runtime: "edge" };

const FEATUREOS_URL = "https://api.featureos.app/api/v3/feature_requests";

function mask(v) {
  return v && v.length > 8 ? v.slice(0, 4) + "..." + v.slice(-4) : v;
}

// Build the equivalent curl so the UI can render it as live docs.
// API-KEY always sent; Bearer JWT added when present (user-specific auth).
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

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { apiKey, jwt, title, description, bucket_id, tag_ids, state_id } =
    payload || {};

  if (!apiKey) return json({ error: "Missing FeatureOS API key" }, 400);
  if (!title) return json({ error: "Missing title" }, 400);
  if (!bucket_id) return json({ error: "Missing bucket_id (board id)" }, 400);

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

    if (!upstream.ok) return json({ error: data, curl }, upstream.status);
    return json({ data, curl }, 200);
  } catch (err) {
    return json({ error: String(err), curl }, 502);
  }
}
