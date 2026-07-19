import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { gloryShotsOpen, postSmackTalk } from "../data/repository";
import { useApp } from "../context/AppContext";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

export function SmackTalkPage({ onBack }: { onBack?: () => void }) {
  const { user } = useApp();
  const posts = useLiveQuery(() => db.smackTalk.orderBy("createdAt").reverse().toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const [draft, setDraft] = useState("");
  const open = gloryShotsOpen();

  const post = async () => {
    if (!user || !draft.trim()) return;
    await postSmackTalk(user.id, draft);
    setDraft("");
  };

  return (
    <div className="page">
      {onBack && <BackButton onBack={onBack} />}
      <div className="page-kicker" style={{ marginTop: onBack ? 12 : 0 }}>The trash talk board</div>
      <h2 className="page-title">Smack Talk</h2>
      <p className="page-sub">
        Say your piece before the lines go in.
        {!open && " Posting is closed for the season — back January 1st."}
      </p>

      {open && (
        <div className="card">
          <div className="chat-input-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && post()}
              placeholder="Talk your talk…"
              maxLength={150}
            />
            <button className="btn small" onClick={post} aria-label="Post">
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="scribbles" size={30} />
          </div>
          No smack talk yet. Somebody start something.
        </div>
      )}

      {posts.map((p) => {
        const author = users.find((u) => u.id === p.userId);
        return (
          <article className="catch-card" key={p.id}>
            <div className="body">
              <div className="headline">
                <span className="species" style={{ fontSize: 15 }}>
                  {author?.name ?? "Unknown angler"}
                </span>
                <span style={{ marginLeft: "auto", color: "var(--sand-faint)", fontSize: 12.5 }}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: 14.5, marginTop: 6 }}>{p.message}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
