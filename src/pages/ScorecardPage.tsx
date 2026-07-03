import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { useApp } from "../context/AppContext";
import { RoleBadge } from "../components/RoleBadge";
import { Icon } from "../components/Icon";
import type { CatchEntry } from "../domain/types";

export function ScorecardPage() {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();

  const live = useLiveQuery(async () => {
    const approved = await db.catches
      .where("tournamentYear")
      .equals(year)
      .and((c) => c.status === "APPROVED")
      .toArray();
    const anglers = new Set(approved.map((c) => c.userId)).size;
    const biggest = approved.reduce((m, c) => Math.max(m, c.lengthInches), 0);
    return { count: approved.length, anglers, biggest };
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

      <div className="live-panel">
        <Icon name="fish" size={120} className="fish-deco" strokeWidth={1.4} />
        <div className="live-tag">
          <span className="live-dot" /> Live
        </div>
        <div className="big-count">{live?.count ?? 0}</div>
        <div className="count-label">fish landed &amp; verified</div>
        <div className="live-sub">
          <div>
            <b>{live?.anglers ?? 0}</b>
            <span>on the board</span>
          </div>
          <div>
            <b>{live?.biggest ? `${live.biggest}"` : "—"}</b>
            <span>biggest so far</span>
          </div>
        </div>
      </div>

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
