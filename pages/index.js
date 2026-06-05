import { useState, useEffect } from "react";
import Head from "next/head";
import { g2Posts } from "@/data/g2Posts";

const LS_KEY = "g2-featureos-demo";

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="rating">
      {"★".repeat(full)}
      {half ? "½" : ""} {rating.toFixed(1)}
    </span>
  );
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [bucketId, setBucketId] = useState("");

  // SSO -> JWT
  const [ssoKey, setSsoKey] = useState("");
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoName, setSsoName] = useState("");
  const [jwt, setJwt] = useState("");
  const [jwtState, setJwtState] = useState({});

  // per-post state: { [id]: { loading, ok, message, curl } }
  const [state, setState] = useState({});

  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (saved.apiKey) setApiKey(saved.apiKey);
      if (saved.bucketId) setBucketId(saved.bucketId);
      if (saved.ssoKey) setSsoKey(saved.ssoKey);
      if (saved.ssoEmail) setSsoEmail(saved.ssoEmail);
      if (saved.ssoName) setSsoName(saved.ssoName);
      if (saved.jwt) setJwt(saved.jwt);
    } catch {
      /* ignore bad/blocked storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration, so we don't clobber saved values).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ apiKey, bucketId, ssoKey, ssoEmail, ssoName, jwt })
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, apiKey, bucketId, ssoKey, ssoEmail, ssoName, jwt]);

  function clearStored() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setApiKey("");
    setBucketId("");
    setSsoKey("");
    setSsoEmail("");
    setSsoName("");
    setJwt("");
    setJwtState({});
  }

  async function generateJwt() {
    setJwtState({ loading: true });
    try {
      const resp = await fetch("/api/featureos/generate-jwt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssoKey, email: ssoEmail, name: ssoName }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setJwt("");
        setJwtState({ loading: false, ok: false, message: json.error });
        return;
      }
      setJwt(json.token);
      setJwtState({ loading: false, ok: true, message: "JWT generated — will be used as Authorization for new posts" });
    } catch (err) {
      setJwt("");
      setJwtState({ loading: false, ok: false, message: String(err) });
    }
  }

  async function createInFeatureOS(post) {
    setState((s) => ({ ...s, [post.id]: { loading: true } }));

    try {
      const resp = await fetch("/api/featureos/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          jwt, // if set, proxy uses Authorization header instead of API-KEY
          bucket_id: bucketId,
          title: post.title,
          description: `${post.description}\n\n— via G2 review by ${post.reviewer} (${post.company})`,
        }),
      });

      const json = await resp.json();

      if (!resp.ok) {
        setState((s) => ({
          ...s,
          [post.id]: {
            loading: false,
            ok: false,
            message:
              typeof json.error === "string"
                ? json.error
                : json.error?.error || JSON.stringify(json.error),
            curl: json.curl,
          },
        }));
        return;
      }

      const created = json.data?.feature_request || json.data;
      setState((s) => ({
        ...s,
        [post.id]: {
          loading: false,
          ok: true,
          message: `Created post${created?.slug ? ` (#${created.slug})` : ""}`,
          curl: json.curl,
        },
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        [post.id]: { loading: false, ok: false, message: String(err) },
      }));
    }
  }

  const ready = apiKey.trim() && bucketId.trim();

  return (
    <>
      <Head>
        <title>G2 → FeatureOS</title>
      </Head>
      <div className="container">
        <div className="header">
          <h1>G2 Reviews → FeatureOS</h1>
          <p>
            Pull feature asks from G2 reviews and push them into FeatureOS as
            posts with one click.
          </p>
        </div>

        <div className="keybar">
          <label htmlFor="apiKey">FeatureOS API key</label>
          <input
            id="apiKey"
            type="password"
            placeholder="Paste your FeatureOS API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <label htmlFor="bucketId" style={{ marginTop: 14 }}>
            Bucket ID (board id — required)
          </label>
          <input
            id="bucketId"
            type="text"
            placeholder="e.g. 1234"
            value={bucketId}
            onChange={(e) => setBucketId(e.target.value)}
          />
          <p className="hint">
            Key is sent to our <code>/api/featureos/create-post</code> proxy,
            never to FeatureOS directly from the browser. Get a bucket id from
            the list-buckets endpoint.
          </p>
          <p className="hint">
            Values are saved in <code>localStorage</code> for preload. Convenient
            for a demo, but secrets in localStorage are exposed to any XSS — don't
            use real prod keys here.
          </p>
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-ghost" onClick={clearStored}>
              Clear saved values
            </button>
          </div>
        </div>

        <div className="keybar">
          <div className="section-title" style={{ marginTop: 0 }}>
            SSO → JWT (optional, user-specific auth)
          </div>
          <label htmlFor="ssoKey">SSO key (secret)</label>
          <input
            id="ssoKey"
            type="password"
            placeholder="Paste your FeatureOS SSO key"
            value={ssoKey}
            onChange={(e) => setSsoKey(e.target.value)}
          />
          <label htmlFor="ssoEmail" style={{ marginTop: 14 }}>
            User email
          </label>
          <input
            id="ssoEmail"
            type="email"
            placeholder="user@company.com"
            value={ssoEmail}
            onChange={(e) => setSsoEmail(e.target.value)}
          />
          <label htmlFor="ssoName" style={{ marginTop: 14 }}>
            User name (optional)
          </label>
          <input
            id="ssoName"
            type="text"
            placeholder="Jane Doe"
            value={ssoName}
            onChange={(e) => setSsoName(e.target.value)}
          />
          <div style={{ marginTop: 14 }}>
            <button
              className="btn"
              disabled={!ssoKey.trim() || !ssoEmail.trim() || jwtState.loading}
              onClick={generateJwt}
            >
              {jwtState.loading ? "Generating…" : "Generate JWT token"}
            </button>
          </div>
          {jwtState.message && (
            <div className={`status ${jwtState.ok ? "ok" : "err"}`}>
              {jwtState.ok ? "✓ " : "✗ "}
              {jwtState.message}
            </div>
          )}
          {jwt && (
            <>
              <div className="section-title">JWT token (HS256)</div>
              <pre className="curl">{jwt}</pre>
            </>
          )}
          <p className="hint">
            Signed server-side (<code>HS256</code>, payload{" "}
            <code>{"{ email, name }"}</code>) — the SSO secret never reaches the
            browser. When a JWT is present it is sent as the{" "}
            <code>Authorization</code> header instead of <code>API-KEY</code>.
          </p>
        </div>

        {g2Posts.map((post) => {
          const st = state[post.id] || {};
          return (
            <div className="post" key={post.id}>
              <div className="post-top">
                <h3>{post.title}</h3>
                <Stars rating={post.rating} />
              </div>
              <p className="meta">
                {post.reviewer} · {post.company}
              </p>
              <p className="desc">{post.description}</p>

              <button
                className="btn"
                disabled={!ready || st.loading}
                onClick={() => createInFeatureOS(post)}
                title={ready ? "" : "Enter API key and bucket id first"}
              >
                {st.loading ? "Creating…" : "Create in FeatureOS"}
              </button>

              {st.message && (
                <div className={`status ${st.ok ? "ok" : "err"}`}>
                  {st.ok ? "✓ " : "✗ "}
                  {st.message}
                </div>
              )}

              {st.curl && (
                <>
                  <div className="section-title">cURL we called (docs)</div>
                  <pre className="curl">{st.curl}</pre>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
