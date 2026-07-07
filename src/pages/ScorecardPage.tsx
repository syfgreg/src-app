import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { useApp } from "../context/AppContext";
import { RoleBadge } from "../components/RoleBadge";
import { Icon } from "../components/Icon";
import { OceanReport } from "../components/OceanReport";
import type { CatchEntry } from "../domain/types";

export function ScorecardPage({ onViewResults }: { onViewResults?: () => void }) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();

  const live = useLiveQuery(async () => {
    const count = await db.catches
      .where("tournamentYear")
      .equals(year)
      .and((c) => c.status === "APPROVED")
      .count();
    return { count };
  }, [year]);

  const mine =
    useLiveQuery(
      () =>
        user
          ? db.catches
              .where("userId")
              .equals(user.id)
              .and((c) => c.tournamentYear === year)
              .reverse()
              .sortBy("createdAt")
          : Promise.resolve<CatchEntry[]>([]),
      [user?.id, year],
    ) ?? [];

  const myTotal = mine
    .filter((c) => c.status === "APPROVED")
    .reduce((s, c) => s + c.pointValue, 0);

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-kicker">S.R.C. {year}</div>
      <h2 className="page-title">Tournament Live</h2>
      <p className="page-sub">The pulse of the beach, and your card.</p>

      {settings?.state === "PUBLISHED" && (
        <div
          className="results-banner"
          role={onViewResults ? "button" : undefined}
          onClick={onViewResults}
        >
          <Icon name="trophy" size={24} />
          <div className="rb-text">
            <b>Results are official</b>
            <span>Tap to see the final standings</span>
          </div>
          <Icon name="next" size={18} />
        </div>
      )}

      <div className="live-panel">
        <Icon name="fish" size={120} className="fish-deco" strokeWidth={1.4} />
        <div className="live-tag">
          <span className="live-dot" /> Live
        </div>
        <div className="big-count">{live?.count ?? 0}</div>
        <div className="count-label">fish landed &amp; verified</div>
      </div>

      <OceanReport />

      <div className="card">
        <div className="scorecard-head">
          <div className="who">
            <div className="name">
              {user.name}
              {user.nickname ? ` "${user.nickname}"` : ""}
            </div>
            <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>The Participant's Scorecard</span>
              <RoleBadge role={user.roleTag} />
            </div>
          </div>
          <div className="total">
            <b>{myTotal.toLocaleString()}</b>
            <span>points</span>
          </div>
        </div>

        {mine.length === 0 ? (
          <div className="empty-state" style={{ padding: "28px 12px" }}>
            <div className="empty-icon">
              <Icon name="waves" size={30} />
            </div>
            No fish on your card yet. Get a line in the water.
          </div>
        ) : (
          <div>
            {mine.map((c) => (
              <div className={`sc-row ${c.status !== "APPROVED" ? "dim" : ""}`} key={c.id}>
                <div className="sc-species">
                  {c.species}
                  <small>
                    {c.gearType === "LURE" ? "Artificial lure" : "Bait"}
                    {c.status === "PENDING" ? " · pending M.O.C." : c.status === "REJECTED" ? " · rejected" : ""}
                    {c.isTrophy ? " · Trophy" : ""}
                    {c.isRecordBreaker ? " · Record" : ""}
                  </small>
                </div>
                <div className="sc-len">{c.lengthInches}"</div>
                <div className="sc-pts">
                  {c.status === "APPROVED" ? `+${c.pointValue.toLocaleString()}` : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
