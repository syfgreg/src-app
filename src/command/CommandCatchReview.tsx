import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { broadcast, decideCatch, deleteCatch, overrideCatch, resolveRecordBreakers } from "../data/repository";
import { scoreCatch, floorToQuarter } from "../domain/scoring";
import { Icon } from "../components/Icon";
import type { CatchEntry } from "../domain/types";

type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

/** Desktop data-table version of catch review (mobile uses ScorecardsReviewPage's
 * per-angler cards). Same underlying data/actions, just a denser flat table. */
export function CommandCatchReview() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const catches = useLiveQuery(() => db.catches.where("tournamentYear").equals(year).toArray(), [year], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLen, setEditLen] = useState("");

  const rows = catches
    .filter((c) => filter === "ALL" || c.status === filter)
    .sort((a, b) => b.createdAt - a.createdAt);

  const nameFor = (uid: string) => users.find((u) => u.id === uid)?.name ?? "Unknown angler";
  const nicknameFor = (uid: string) => {
    const u = users.find((x) => x.id === uid);
    return u?.nickname ?? u?.name ?? "An angler";
  };

  const accept = async (c: CatchEntry) => {
    await decideCatch(c.id, "APPROVED", "M.O.C. — official");
    await broadcast(
      `M.O.C. VERIFIED: ${nicknameFor(c.userId)} landed a ${c.species}${c.gearType === "LURE" ? " on an artificial lure" : ""}!`,
    );
    if (c.isRecordBreaker) await resolveRecordBreakers(c.species, c.tournamentYear);
  };
  const reject = (c: CatchEntry) => decideCatch(c.id, "REJECTED", "M.O.C.");
  const strike = (c: CatchEntry) => {
    if (confirm("Strike this catch from the ledger entirely?")) deleteCatch(c.id);
  };
  const startRescore = (c: CatchEntry) => {
    setEditingId(c.id);
    setEditLen(String(c.lengthInches));
  };
  const submitRescore = async (c: CatchEntry) => {
    const len = floorToQuarter(parseFloat(editLen));
    if (!records || !len || len <= 0) return;
    const s = scoreCatch(c.species, len, c.gearType, records);
    await overrideCatch(c.id, {
      lengthInches: len,
      pointValue: s.points,
      isTrophy: s.isTrophy,
      isRecordBreaker: s.isRecordBreaker,
      verifiedBy: "M.O.C. (official measurement)",
    });
    if (s.isRecordBreaker) await resolveRecordBreakers(c.species, c.tournamentYear);
    setEditingId(null);
    setEditLen("");
  };

  return (
    <div className="page">
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h2 className="page-title">Catch Review</h2>
          <p className="page-sub">Approve, reject, or remove catches for the {year} tournament.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} style={{ width: "auto" }}>
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="cc-catch-table">
        <div className="cc-catch-row cc-catch-head">
          <div>Angler</div>
          <div>Species</div>
          <div>Inches</div>
          <div>Gear</div>
          <div>Points</div>
          <div>Flags</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {rows.map((c) => (
          <div className="cc-catch-row" key={c.id}>
            <div>{nameFor(c.userId)}</div>
            <div>{c.species}</div>
            <div>{c.lengthInches}&quot;</div>
            <div>{c.gearType === "LURE" ? "Lure" : "Bait"}</div>
            <div>{c.pointValue.toLocaleString()}</div>
            <div className="cc-catch-flags">
              {c.isTrophy && <span className="tag trophy">Trophy</span>}
              {c.isRecordBreaker && <span className="tag record">Record</span>}
            </div>
            <div>
              <span className={`tag ${c.status.toLowerCase()}`}>{c.status}</span>
            </div>
            <div className="cc-catch-actions">
              {editingId === c.id ? (
                <>
                  <input
                    type="number"
                    step="0.25"
                    value={editLen}
                    onChange={(e) => setEditLen(e.target.value)}
                    style={{ width: 70 }}
                  />
                  <button className="btn small seafoam" onClick={() => submitRescore(c)}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  {c.status !== "APPROVED" && (
                    <button className="header-btn" style={{ width: 32, height: 32 }} onClick={() => accept(c)} aria-label="Approve">
                      <Icon name="check" size={15} />
                    </button>
                  )}
                  {c.status !== "REJECTED" && (
                    <button className="header-btn" style={{ width: 32, height: 32 }} onClick={() => reject(c)} aria-label="Reject">
                      <Icon name="x" size={15} />
                    </button>
                  )}
                  <button className="btn small ghost" onClick={() => startRescore(c)}>
                    Rescore
                  </button>
                  <button className="header-btn" style={{ width: 32, height: 32 }} onClick={() => strike(c)} aria-label="Strike">
                    <Icon name="trash" size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <p style={{ color: "var(--sand-faint)", fontSize: 14, padding: 20, textAlign: "center" }}>
            No catches match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
