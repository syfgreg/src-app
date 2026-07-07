import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { decideCatch, deleteCatch, overrideCatch, setReviewedAnglers } from "../data/repository";
import { scoreCatch } from "../domain/scoring";
import { useApp } from "../context/AppContext";
import { BackButton } from "../components/BackButton";
import { RoleBadge } from "../components/RoleBadge";
import { Icon } from "../components/Icon";
import type { CatchEntry } from "../domain/types";

/**
 * M.O.C.-only end-of-tournament review: every angler's scorecard in real time,
 * with per-catch edit (rescore) / decline / strike and a per-scorecard
 * "validated" toggle that gates Publish Results.
 */
export function ScorecardsReviewPage({ onBack }: { onBack: () => void }) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);
  const catches = useLiveQuery(
    () => db.catches.where("tournamentYear").equals(year).toArray(),
    [year],
    [],
  );
  const [editLen, setEditLen] = useState<Record<string, string>>({});

  if (user?.roleTag !== "MOC") {
    return (
      <div className="page">
        <BackButton onBack={onBack} />
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="shield" size={30} />
          </div>
          Scorecard review is for the M.O.C. only.
        </div>
      </div>
    );
  }

  const reviewed = new Set(settings?.reviewedAnglers ?? []);

  const byAngler = new Map<string, CatchEntry[]>();
  for (const c of catches) {
    const arr = byAngler.get(c.userId) ?? [];
    arr.push(c);
    byAngler.set(c.userId, arr);
  }

  const rows = [...byAngler.entries()]
    .map(([uid, cs]) => {
      const u = users.find((x) => x.id === uid);
      const total = cs.filter((c) => c.status === "APPROVED").reduce((s, c) => s + c.pointValue, 0);
      const sorted = [...cs].sort((a, b) => b.createdAt - a.createdAt);
      const hasApproved = cs.some((c) => c.status === "APPROVED");
      return { uid, u, cs: sorted, total, hasApproved };
    })
    .sort((a, b) => b.total - a.total);

  const anglersToValidate = rows.filter((r) => r.hasApproved);
  const validatedCount = anglersToValidate.filter((r) => reviewed.has(r.uid)).length;

  const toggleValidate = async (uid: string) => {
    const next = new Set(reviewed);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    await setReviewedAnglers([...next]);
  };

  const rescore = async (c: CatchEntry) => {
    const len = parseFloat(editLen[c.id] ?? "");
    if (!settings || !records || !len || len <= 0) return;
    const s = scoreCatch(c.species, len, c.gearType, settings, records);
    await overrideCatch(c.id, {
      lengthInches: len,
      pointValue: s.points,
      isTrophy: s.isTrophy,
      isRecordBreaker: s.isRecordBreaker,
      verifiedBy: "M.O.C. (official measurement)",
    });
    setEditLen((d) => ({ ...d, [c.id]: "" }));
  };
  const decline = (id: string) => decideCatch(id, "REJECTED", "M.O.C.");
  const reinstate = (id: string) => decideCatch(id, "APPROVED", "M.O.C.");
  const strike = (id: string) => {
    if (confirm("Strike this catch from the ledger entirely?")) deleteCatch(id);
  };

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>End-of-tournament review</div>
      <h2 className="page-title">Scorecards</h2>
      <p className="page-sub">
        {anglersToValidate.length === 0
          ? "No scored catches yet."
          : `${validatedCount}/${anglersToValidate.length} scorecards validated · updates live`}
      </p>

      {rows.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="scorecard" size={30} />
          </div>
          No catches on the board yet.
        </div>
      )}

      <div className="stagger">
        {rows.map(({ uid, u, cs, total }) => (
          <div className="card" key={uid}>
            <div className="scorecard-head">
              <div className="who">
                <div className="name">
                  {u?.name ?? "Unknown angler"}
                  {u?.nickname ? ` "${u.nickname}"` : ""}
                </div>
                <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {u && <RoleBadge role={u.roleTag} />}
                  {reviewed.has(uid) && (
                    <span className="tag approved">
                      <Icon name="check" /> Validated
                    </span>
                  )}
                </div>
              </div>
              <div className="total">
                <b>{total.toLocaleString()}</b>
                <span>points</span>
              </div>
            </div>

            {cs.map((c) => (
              <div className={`sc-row ${c.status !== "APPROVED" ? "dim" : ""}`} key={c.id} style={{ flexWrap: "wrap" }}>
                <div className="sc-species">
                  {c.species}
                  <small>
                    {c.gearType === "LURE" ? "Artificial lure" : "Bait"}
                    {c.status === "REJECTED" ? " · declined" : ""}
                    {c.isTrophy ? " · Trophy" : ""}
                    {c.isRecordBreaker ? " · Record" : ""}
                  </small>
                </div>
                <div className="sc-len">{c.lengthInches}"</div>
                <div className="sc-pts">{c.status === "APPROVED" ? `+${c.pointValue.toLocaleString()}` : "—"}</div>
                <div style={{ flexBasis: "100%", display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {c.status === "APPROVED" ? (
                    <button className="btn small danger" onClick={() => decline(c.id)}>
                      <Icon name="x" size={15} /> Decline
                    </button>
                  ) : (
                    <button className="btn small seafoam" onClick={() => reinstate(c.id)}>
                      <Icon name="check" size={15} /> Reinstate
                    </button>
                  )}
                  <button className="btn small ghost" onClick={() => strike(c.id)}>
                    <Icon name="trash" size={15} /> Strike
                  </button>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="Edit inches"
                    value={editLen[c.id] ?? ""}
                    onChange={(e) => setEditLen((d) => ({ ...d, [c.id]: e.target.value }))}
                    style={{ width: 120, flex: "0 0 auto" }}
                  />
                  <button className="btn small" onClick={() => rescore(c)}>
                    Rescore
                  </button>
                </div>
              </div>
            ))}

            <button
              className={`btn ${reviewed.has(uid) ? "ghost" : "seafoam"}`}
              style={{ marginTop: 12 }}
              onClick={() => toggleValidate(uid)}
            >
              <Icon name={reviewed.has(uid) ? "x" : "check"} size={16} />{" "}
              {reviewed.has(uid) ? "Un-validate scorecard" : "Validate scorecard"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
