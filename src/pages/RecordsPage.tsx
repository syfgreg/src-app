import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { RUNNER_UP_RECORDS } from "../domain/records";

export function RecordsPage({ onBack }: { onBack: () => void }) {
  const records = useLiveQuery(() => db.records.toArray(), [], []);

  return (
    <div className="page">
      <button className="btn ghost small" onClick={onBack}>‹ Back</button>
      <div className="page-kicker" style={{ marginTop: 12 }}>Section 5-H</div>
      <h2 className="page-title">The Record Book</h2>
      <p className="page-sub">
        Beat a standing record and the app flags it instantly — then present the fish to the M.O.C.
        Exact measurements only.
      </p>

      <div className="card">
        {records
          .slice()
          .sort((a, b) => b.lengthInches - a.lengthInches)
          .map((r) => {
            const runnerUp = RUNNER_UP_RECORDS.find((x) => x.species === r.species);
            const open = r.lengthInches === 0;
            return (
              <div className={`record-row ${open ? "open" : ""}`} key={r.species}>
                <div style={{ flex: 2 }}>
                  <div className="species">{r.species}</div>
                  <div className="holder">
                    {open ? r.holder : `${r.holder} · ${r.year ?? ""}`}
                    {runnerUp && !open && (
                      <span style={{ display: "block", fontSize: 11.5 }}>
                        2nd: {runnerUp.holder} — {runnerUp.lengthInches}" ({runnerUp.year})
                      </span>
                    )}
                  </div>
                </div>
                <div className="len">{open ? "OPEN" : `${r.lengthInches}"`}</div>
              </div>
            );
          })}
      </div>
      <p style={{ color: "var(--sand-faint)", fontSize: 12.5 }}>
        The Coveted Sea Robin record stands at 0" — nobody has ever landed one at the Sea Robin
        Classic. Be the first.
      </p>
    </div>
  );
}
