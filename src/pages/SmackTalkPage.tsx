import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { addSmackTalkReply, deleteSmackTalk, gloryShotsOpen, postSmackTalk } from "../data/repository";
import { useApp } from "../context/AppContext";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

export function SmackTalkPage({ onBack }: { onBack?: () => void }) {
  const { user } = useApp();
  const posts = useLiveQuery(() => db.smackTalk.orderBy("createdAt").reverse().toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const open = gloryShotsOpen();

  const post = async () => {
    if (!user || !draft.trim()) return;
    await postSmackTalk(user.id, draft);
    setDraft("");
  };

  const reply = async (postId: string) => {
    const text = replyDrafts[postId]?.trim();
    if (!text || !user) return;
    await addSmackTalkReply(postId, { userName: user.nickname ?? user.name, text, at: Date.now() });
    setReplyDrafts((d) => ({ ...d, [postId]: "" }));
  };

  const remove = (postId: string) => {
    if (confirm("Delete this thread from the Smack Talk board?")) deleteSmackTalk(postId);
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
                {user?.roleTag === "MOC" && (
                  <button className="btn small ghost" onClick={() => remove(p.id)} aria-label="Delete thread">
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: 14.5, marginTop: 6 }}>{p.message}</p>
              {p.replies.map((r, i) => (
                <div key={i} className="breakdown" style={{ marginTop: 6 }}>
                  <strong>{r.userName}:</strong> {r.text}
                </div>
              ))}
              {open && (
                <div className="chat-input-row" style={{ marginTop: 10 }}>
                  <input
                    value={replyDrafts[p.id] ?? ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && reply(p.id)}
                    placeholder="Reply…"
                  />
                  <button className="btn small" onClick={() => reply(p.id)} aria-label="Reply">
                    <Icon name="send" size={16} />
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
