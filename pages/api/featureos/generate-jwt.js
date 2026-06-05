// Generate a FeatureOS SSO JWT (HS256) from an SSO key + user identity.
// Mirrors: jwt.sign({ email, name }, SSO_KEY, { algorithm: "HS256" })
// Done server-side so the SSO secret never ships to the browser.
// Ref: https://help.featureos.app/en/articles/setting-up-single-sign-on-for-your-featureos-portal/
import crypto from "crypto";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ssoKey, email, name } = req.body || {};

  if (!ssoKey) return res.status(400).json({ error: "Missing SSO key" });
  if (!email) return res.status(400).json({ error: "Missing email" });

  // FeatureOS expects at minimum email + name in the payload.
  const payload = { email, name: name || email.split("@")[0] };

  try {
    const token = signHS256(payload, ssoKey);
    return res.status(200).json({ token, payload });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
