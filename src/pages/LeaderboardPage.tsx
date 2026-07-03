import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { RoleBadge } from "../components/RoleBadge";
import { CatchCard } from "../components/CatchCard";

export function LeaderboardPage({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();

  const rows = useLiveQuery(async () => {
    const catches = await db.catches
      .where("tournamentYear")
      .equals(year)
      .and((c) => c.status === "APPROVED")
      .toArray();
    const users = await db.users.toArray();
    return users
      .map((u) => {
        const mine = catches.filter((c) => c.userId === u.id);
        const pts = mine.reduce((s, c) => s + c.pointValue, 0);
        const biggest = mine.reduce((m, c) => Math.max(m, c.lengthInches), 0);
        return { user: u, pts, count: mine.length, biggest };
      })
      .filter((r) => r.count > 0 || r.user.roleTag === "CHAMP")
      .sort((a, b) => b.pts - a.pts);
  }, [year]);

  const latest = useLiveQuery(
    () =>
      db.catches
        .orderBy("createdAt")
        .reverse()
        .filter((c) => c.status === "APPROVED" && c.tournamentYear === year)
        .limit(3)
        .toArray(),
    [year],
  );
  const users = useLiveQuery(() => db.users.toArray(), [], []);

  const rankCls = (i: number) => (i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "");

  return (
    <div className="page">
      <div className="page-kicker">S.R.C. {year}</div>
      <h2 className="page-title">Live Leaderboard</h2>
      <p className="page-sub">Approved catches only. All scores final per the M.O.C.</p>

      {(!rows || rows.length === 0) && (
        <div className="empty-state">
          <div className="big">🌊</div>
          Nothing on the board yet. First verified fish takes the lead —{" "}
          <strong>get a line in the water.</strong>
        </div>
      )}

      <div className="stagger">
      {rows?.map((r, i) => (
        <div
          key={r.user.id}
          className={`lb-row ${rankCls(i)}`}
          onClick={() => onOpenProfile(r.user.id)}
          role="button"
        >
          <div className="rank">{i + 1}</div>
          <div className="who">
            <div className="name">
              {r.user.name}
              {r.user.nickname ? ` "${r.user.nickname}"` : ""}
            </div>
            <div className="meta">
              {r.count} fish · biggest {r.biggest}" · <RoleBadge role={r.user.roleTag} />
            </div>
          </div>
          <div className="pts">
            {r.pts.toLocaleString()}
            <small>PTS</small>
          </div>
        </div>
      ))}
      </div>

      {latest && latest.length > 0 && (
        <>
          <h3 style={{ margin: "22px 0 10px", fontFamily: "var(--font-head)", textTransform: "uppercase", letterSpacing: 2, color: "var(--sand-dim)" }}>
            Fresh off the sand
          </h3>
          {latest.map((c) => (
            <CatchCard key={c.id} entry={c} angler={users.find((u) => u.id === c.userId)} />
          ))}
        </>
      )}
    </div>
  );
}
