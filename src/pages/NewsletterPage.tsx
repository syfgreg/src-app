import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { deleteNewsletter } from "../data/repository";
import { useApp } from "../context/AppContext";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

/** Render a URL inside the body as a short clickable link instead of the raw,
 * often-overflowing address text. */
function renderBody(body: string) {
  const match = body.match(/(https?:\/\/\S+)/);
  if (!match || match.index === undefined) return body;
  const url = match[0];
  const before = body.slice(0, match.index);
  const after = body.slice(match.index + url.length);
  return (
    <>
      {before}
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--flare)", fontWeight: 600 }}>
        Click here
      </a>
      {after}
    </>
  );
}

/**
 * Newsletter bulletin: the M.O.C. composes dated posts; every angler reads the
 * feed. Read-only for non-M.O.C. roles.
 */
export function NewsletterPage({ onBack }: { onBack: () => void }) {
  const { user } = useApp();
  const posts = useLiveQuery(() => db.newsletters.orderBy("createdAt").reverse().toArray(), [], []);
  const isMoc = user?.roleTag === "MOC";

  const remove = (id: string) => {
    if (confirm("Delete this newsletter post?")) deleteNewsletter(id);
  };

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>From the M.O.C.</div>
      <h2 className="page-title">Newsletter</h2>
      <p className="page-sub">Tournament news, notices, and dispatches from the M.O.C.</p>

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
              {isMoc && !p.protected && (
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
            <p style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.55, marginTop: 6 }}>{renderBody(p.body)}</p>
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
