import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { deleteNewsletter, publishNewsletter } from "../data/repository";
import { useApp } from "../context/AppContext";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

/**
 * Newsletter bulletin: the M.O.C. composes dated posts; every angler reads the
 * feed. Read-only for non-M.O.C. roles.
 */
export function NewsletterPage({ onBack }: { onBack: () => void }) {
  const { user } = useApp();
  const posts = useLiveQuery(() => db.newsletters.orderBy("createdAt").reverse().toArray(), [], []);
  const isMoc = user?.roleTag === "MOC";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async () => {
    if (!title.trim() || !body.trim() || !user) return;
    setBusy(true);
    try {
      await publishNewsletter({
        title: title.trim(),
        body: body.trim(),
        author: user.nickname ? `${user.name} "${user.nickname}"` : user.name,
      });
      setTitle("");
      setBody("");
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    if (confirm("Delete this newsletter post?")) deleteNewsletter(id);
  };

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>From the M.O.C.</div>
      <h2 className="page-title">Newsletter</h2>
      <p className="page-sub">Tournament news, notices, and dispatches from the M.O.C.</p>

      {isMoc && (
        <div className="card">
          <h3>Post an update</h3>
          <label className="field">
            <span>Headline</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Registration opens Friday" />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your update…" />
          </label>
          <button className="btn" disabled={busy || !title.trim() || !body.trim()} onClick={post}>
            <Icon name="send" size={16} /> {busy ? "Posting…" : "Publish to the roster"}
          </button>
        </div>
      )}

      {posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="message" size={30} />
          </div>
          No dispatches yet. Check back for word from the M.O.C.
        </div>
      )}

      <div className="stagger">
        {posts.map((p) => (
          <div className="card" key={p.id}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <h3
                style={{
                  color: "var(--sand)",
                  textTransform: "none",
                  letterSpacing: 0,
                  fontSize: 18,
                  fontFamily: "var(--font-display)",
                  flex: 1,
                  margin: 0,
                }}
              >
                {p.title}
              </h3>
              {isMoc && (
                <button
                  className="header-btn"
                  style={{ width: 32, height: 32 }}
                  onClick={() => remove(p.id)}
                  aria-label="Delete post"
                >
                  <Icon name="trash" size={15} />
                </button>
              )}
            </div>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.55, marginTop: 6 }}>{p.body}</p>
            <div
              style={{
                color: "var(--sand-faint)",
                fontSize: 12,
                marginTop: 10,
                fontFamily: "var(--font-head)",
              }}
            >
              {p.author} · {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
