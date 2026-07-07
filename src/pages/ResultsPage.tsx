import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

/**
 * Final standings, revealed once the M.O.C. publishes. Ranked by total points
 * from APPROVED catches, plus the records set this tournament.
 */
export function ResultsPage({ onBack }: { onBack: () => void }) {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);
  const catches = useLiveQuery(
    () =>
      db.catches
        .where("tournamentYear")
        .equals(year)
        .and((c) => c.status === "APPROVED")
        .toArray(),
    [year],
    [],
  );

  const published = settings?.state === "PUBLISHED";

  if (!published) {
    return (
      <div className="page">
        <BackButton onBack={onBack} />
        <div className="page-kicker" style={{ marginTop: 12 }}>S.R.C. {year}</div>
        <h2 className="page-title">Final Results</h2>
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="trophy" size={30} />
          </div>
          {settings?.state === "ENDED"
            ? "The tournament has ended — the M.O.C. is validating scorecards. Results drop soon."
            : "The tournament is still underway. Final results are published when it wraps."}
        </div>
      </div>
    );
  }

  const totals = new Map<string, { pts: number; count: number }>();
  for (const c of catches) {
    const t = totals.get(c.userId) ?? { pts: 0, count: 0 };
    t.pts += c.pointValue;
    t.count += 1;
    totals.set(c.userId, t);
  }
  const standings = [...totals.entries()]
    .map(([uid, t]) => ({ u: users.find((x) => x.id === uid), uid, ...t }))
    .sort((a, b) => b.pts - a.pts);

  const recordsSet = records.filter((r) => r.year === year);

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>S.R.C. {year} · Official</div>
      <h2 className="page-title">Final Results</h2>
      <p className="page-sub">
        {settings?.publishedAt
          ? `Published ${new Date(settings.publishedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
          : "Official standings"}
      </p>

      {standings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="fish" size={30} />
          </div>
          No verified catches this tournament.
        </div>
      ) : (
        <div className="stagger">
          {standings.map((s, i) => (
            <div
              className={`lb-row ${i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : ""}`}
              key={s.uid}
            >
              <div className="rank">{i + 1}</div>
              <div className="who">
                <div className="name">
                  {s.u?.name ?? "Unknown angler"}
                  {s.u?.nickname ? ` "${s.u.nickname}"` : ""}
                </div>
                <div className="meta">
                  {s.count} verified {s.count === 1 ? "catch" : "catches"}
                </div>
              </div>
              <div className="pts">
                {s.pts.toLocaleString()}
                <small>points</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {recordsSet.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Records set this year</h3>
          {recordsSet.map((r) => (
            <div className="record-row" key={r.species}>
              <div className="species">{r.species}</div>
              <div className="holder">{r.holder}</div>
              <div className="len">{r.lengthInches}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
