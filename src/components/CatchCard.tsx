import type { CatchEntry, User } from "../domain/types";
import { Photo } from "./BlobImage";
import { Icon } from "./Icon";

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
        <div className="meta" style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {angler ? `${angler.name}${angler.nickname ? ` "${angler.nickname}"` : ""} · ` : ""}
          {entry.gearType === "LURE" ? "Artificial lure" : "Bait"} ·{" "}
          {new Date(entry.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {entry.lat != null && (
            <>
              {" · "}
              <Icon name="pin" size={13} />
              {entry.lat.toFixed(3)}, {entry.lng?.toFixed(3)}
            </>
          )}
        </div>
        <div className="tags">
          <span className={`tag ${entry.status.toLowerCase()}`}>{entry.status}</span>
          {entry.isTrophy && (
            <span className="tag trophy">
              <Icon name="trophy" /> Trophy Fish
            </span>
          )}
          {entry.isRecordBreaker && (
            <span className="tag record">
              <Icon name="bolt" /> Record Breaker
            </span>
          )}
          {entry.isSkate && <span className="tag">Wingtip measure</span>}
          {entry.aiConfidence != null && (
            <span className="tag">
              <Icon name="sparkle" /> AI {Math.round(entry.aiConfidence * 100)}%
            </span>
          )}
        </div>
        {entry.aiNotes && (
          <div className="breakdown" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon name="sparkle" size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--flare)" }} />
            <span>{entry.aiNotes}</span>
          </div>
        )}
        {children}
      </div>
    </article>
  );
}
