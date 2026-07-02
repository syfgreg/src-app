import type { CatchEntry, User } from "../domain/types";
import { Photo } from "./BlobImage";

export function CatchCard({
  entry,
  angler,
  children,
}: {
  entry: CatchEntry;
  angler?: User;
  children?: React.ReactNode;
}) {
  return (
    <article className="catch-card">
      <Photo url={entry.photoUrl} blob={entry.photo} alt={entry.species} className="photo" />
      <div className="body">
        <div className="headline">
          <span className="species">{entry.species}</span>
          <span>{entry.lengthInches}"</span>
          <span className="pts">+{entry.pointValue.toLocaleString()}</span>
        </div>
        <div className="meta">
          {angler ? `${angler.name}${angler.nickname ? ` "${angler.nickname}"` : ""} · ` : ""}
          {entry.gearType === "LURE" ? "Artificial lure" : "Bait"} ·{" "}
          {new Date(entry.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {entry.lat != null && ` · 📍 ${entry.lat.toFixed(4)}, ${entry.lng?.toFixed(4)}`}
        </div>
        <div className="tags">
          <span className={`tag ${entry.status.toLowerCase()}`}>{entry.status}</span>
          {entry.isTrophy && <span className="tag trophy">🏆 Trophy Fish</span>}
          {entry.isRecordBreaker && <span className="tag record">⚡ Record Breaker</span>}
          {entry.isSkate && <span className="tag">Skate Clause</span>}
          {entry.aiConfidence != null && (
            <span className="tag">AI {Math.round(entry.aiConfidence * 100)}%</span>
          )}
        </div>
        {entry.aiNotes && <div className="breakdown">🤖 {entry.aiNotes}</div>}
        {children}
      </div>
    </article>
  );
}
