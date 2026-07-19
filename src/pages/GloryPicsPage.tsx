import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { addComment, gloryShotsOpen, lockGloryVote, postGlory, voteGloryFav } from "../data/repository";
import { useApp } from "../context/AppContext";
import { Photo } from "../components/BlobImage";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

export function GloryPicsPage({ onBack }: { onBack?: () => void }) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const pics = useLiveQuery(() => db.gloryPics.orderBy("createdAt").reverse().toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const active = useLiveQuery(async () => {
    const list = await db.tournaments.where("year").equals(year).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [year]);

  const [photo, setPhoto] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<{ url?: string; blob?: Blob } | null>(null);

  // Glory Shot Fav — the M.O.C.-curated nominees for this tournament, most-voted first.
  const gloryFavState = settings?.gloryFavState ?? "OFF";
  const votingOpen = gloryFavState === "OPEN";
  // Tallies/results stay anonymous to participants until the M.O.C. publishes them.
  const showResults = gloryFavState === "PUBLISHED";
  const nominees = pics
    .filter((p) => p.nominatedYear === year)
    .sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0) || a.createdAt - b.createdAt);
  const roster = active?.participantIds ?? [];
  // The M.O.C. runs the vote but can always cast one; otherwise it's the roster
  // (or everyone, when no roster is set).
  const eligible =
    !!user && (user.roleTag === "MOC" || roster.length === 0 || roster.includes(user.id));
  const locked = !!user && (settings?.gloryFavLockedVoters ?? []).includes(user.id);
  const canVote = votingOpen && eligible && !locked;
  const myVoteId = user ? nominees.find((p) => (p.votes ?? []).includes(user.id))?.id : undefined;
  const topVotes = nominees[0]?.votes?.length ?? 0;

  // Tap a shot to vote; tap another to change; tap your pick to clear it — free
  // to change until you lock it in yourself, or the M.O.C. closes voting.
  const castVote = async (picId: string) => {
    if (!user || !canVote) return;
    await voteGloryFav(user.id, picId, year);
  };

  const lockVote = async () => {
    if (!user) return;
    if (confirm("This will lock in your vote — you won't be able to change it. Are you sure you want to proceed?")) {
      await lockGloryVote(user.id);
    }
  };

  const submissionsOpen = gloryShotsOpen();

  const post = async () => {
    if (!photo || !user || !submissionsOpen) return;
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
        {!submissionsOpen && " Submissions are closed for the season — back January 1st."}
      </p>

      {gloryFavState !== "OFF" && (
        <div className="card glory-fav">
          <div className="glory-fav-head">
            <Icon name="trophy" size={20} />
            <div>
              <h3 style={{ margin: 0 }}>Glory Shot Fav!{showResults ? " — Winner!" : ""}</h3>
              <div style={{ color: "var(--sand-dim)", fontSize: 13 }}>
                {active?.name ?? `S.R.C. ${year}`}
                {votingOpen
                  ? locked
                    ? " · your vote is locked in"
                    : eligible
                      ? myVoteId
                        ? " · tap another shot to change your vote"
                        : " · tap a shot to cast your vote"
                      : " · only tournament participants can vote"
                  : gloryFavState === "CLOSED"
                    ? " · voting is closed — winner announced soon"
                    : " · the votes are in!"}
              </div>
            </div>
          </div>

          {nominees.length === 0 ? (
            <p style={{ color: "var(--sand-faint)", fontSize: 14, margin: 0 }}>
              The M.O.C. is finalizing the ballot — check back shortly.
            </p>
          ) : (
            <div className="glory-fav-grid">
              {nominees.map((p) => {
                const author = users.find((u) => u.id === p.userId);
                const count = p.votes?.length ?? 0;
                const mine = p.id === myVoteId;
                const isWinner = showResults && count > 0 && count === topVotes;
                return (
                  <button
                    type="button"
                    key={p.id}
                    className={`glory-fav-card ${mine ? "voted" : ""} ${isWinner ? "winner" : ""} ${!canVote ? "readonly" : ""}`}
                    onClick={() => castVote(p.id)}
                    disabled={!canVote}
                    aria-pressed={mine}
                  >
                    <Photo url={p.photoUrl} blob={p.photo} alt="Glory Shot Fav nominee" className="glory-fav-photo" />
                    <div className="glory-fav-body">
                      <div className="glory-fav-name">
                        {isWinner && <Icon name="trophy" size={14} />} {author?.name ?? "Unknown angler"}
                      </div>
                      {p.description && <div className="glory-fav-desc">{p.description}</div>}
                      <div className="glory-fav-tally">
                        <div className="glory-fav-badges">
                          {isWinner && <span className="tag honor">🏆 Winner</span>}
                          {mine && <span className="tag approved">★ Your pick</span>}
                        </div>
                        {/* Tallies stay hidden from participants until results are published. */}
                        {showResults && (
                          <span className="glory-fav-votes">
                            {count} {count === 1 ? "vote" : "votes"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {votingOpen && eligible && myVoteId && (
            <>
              {locked ? (
                <p className="ok-note" style={{ marginTop: 12 }}>
                  <Icon name="check" size={14} /> Your vote is locked in.
                </p>
              ) : (
                <button className="btn seafoam" style={{ marginTop: 12 }} onClick={lockVote}>
                  <Icon name="check" size={16} /> Submit &amp; lock in my vote
                </button>
              )}
            </>
          )}
        </div>
      )}

      {submissionsOpen ? (
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
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="camera" size={30} />
          </div>
          Glory Shot submissions run January 1st through September 30th. Check back for the new season!
        </div>
      )}

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
            <div role="button" style={{ cursor: "pointer" }} onClick={() => setLightbox({ url: p.photoUrl, blob: p.photo })}>
              <Photo url={p.photoUrl} blob={p.photo} alt="Glory shot" className="photo" />
            </div>
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

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <Photo url={lightbox.url} blob={lightbox.blob} alt="Glory shot" />
        </div>
      )}
    </div>
  );
}
