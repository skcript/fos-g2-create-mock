// Generate a FeatureOS SSO JWT (HS256) from an SSO key + user identity.
// Mirrors: jwt.sign({ email, name }, SSO_KEY, { algorithm: "HS256" })
// Edge runtime — uses Web Crypto (no Node `crypto`). SSO secret stays server-side.
// Ref: https://help.featureos.app/en/articles/setting-up-single-sign-on-for-your-featureos-portal/
export const config = { runtime: "edge" };

function base64url(bytes) {
  let bin = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlStr(str) {
  return base64url(new TextEncoder().encode(str));
}

async function signHS256(payload, secret) {
  const data = `${b64urlStr(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64urlStr(
    JSON.stringify(payload)
  )}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return `${data}.${base64url(sig)}`;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { ssoKey, email, name } = body || {};
  if (!ssoKey) return json({ error: "Missing SSO key" }, 400);
  if (!email) return json({ error: "Missing email" }, 400);

  // FeatureOS expects at minimum email + name in the payload.
  const payload = { email, name: name || email.split("@")[0] };

  try {
    const token = await signHS256(payload, ssoKey);
    return json({ token, payload }, 200);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}
