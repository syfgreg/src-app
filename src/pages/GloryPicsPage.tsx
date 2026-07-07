import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { addComment, postGlory } from "../data/repository";
import { useApp } from "../context/AppContext";
import { Photo } from "../components/BlobImage";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

export function GloryPicsPage({ onBack }: { onBack?: () => void }) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const pics = useLiveQuery(() => db.gloryPics.orderBy("createdAt").reverse().toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);

  const [photo, setPhoto] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const post = async () => {
    if (!photo || !user) return;
    await postGlory({ userId: user.id, photo, description: description.trim() });
    setPhoto(null);
    setDescription("");
  };

  const submitComment = async (picId: string) => {
    const text = commentDrafts[picId]?.trim();
    if (!text || !user) return;
    await addComment(picId, { userName: user.name, text, at: Date.now() });
    setCommentDrafts((d) => ({ ...d, [picId]: "" }));
  };

  return (
    <div className="page">
      {onBack && <BackButton onBack={onBack} />}
      <div className="page-kicker" style={{ marginTop: onBack ? 12 : 0 }}>Off-season feed</div>
      <h2 className="page-title">Glory Shots</h2>
      <p className="page-sub">
        Summer catches only — the between-tournaments bragging board.
        {settings && !settings.offSeasonMode && " (The M.O.C. has the feed set to tournament mode.)"}
      </p>

      <div className="card">
        <h3>Post a glory shot</h3>
        <label className="field">
          <span>Photo</span>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
        <label className="field">
          <span>The story</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="34-inch striper off Montauk, first cast, nobody believes me…"
          />
        </label>
        <button className="btn seafoam" onClick={post} disabled={!photo}>
          Post it
        </button>
      </div>

      {pics.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="camera" size={30} />
          </div>
          No glory yet. Summer's not over.
        </div>
      )}

      {pics.map((p) => {
        const author = users.find((u) => u.id === p.userId);
        return (
          <article className="catch-card" key={p.id}>
            <Photo url={p.photoUrl} blob={p.photo} alt="Glory shot" className="photo" />
            <div className="body">
              <div className="headline">
                <span className="species" style={{ fontSize: 15 }}>
                  {author?.name ?? "Unknown angler"}
                </span>
                <span style={{ marginLeft: "auto", color: "var(--sand-faint)", fontSize: 12.5 }}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
              {p.description && <p style={{ fontSize: 14.5, marginTop: 6 }}>{p.description}</p>}
              {p.comments.map((c, i) => (
                <div key={i} className="breakdown" style={{ marginTop: 6 }}>
                  <strong>{c.userName}:</strong> {c.text}
                </div>
              ))}
              <div className="chat-input-row" style={{ marginTop: 10 }}>
                <input
                  value={commentDrafts[p.id] ?? ""}
                  onChange={(e) => setCommentDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && submitComment(p.id)}
                  placeholder="Talk your talk…"
                />
                <button className="btn small" onClick={() => submitComment(p.id)} aria-label="Comment">
                  <Icon name="send" size={16} />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
