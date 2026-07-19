import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import {
  broadcast,
  createPenalty,
  decideCatch,
  deleteCatch,
  deletePenalty,
  overrideCatch,
  resolveRecordBreakers,
  setReviewedAnglers,
} from "../data/repository";
import { scoreCatch, SCORING, isTrash, scoreCalc, floorToQuarter } from "../domain/scoring";
import { computeStandings } from "../domain/standings";
import { useApp } from "../context/AppContext";
import { BackButton } from "../components/BackButton";
import { RoleBadge } from "../components/RoleBadge";
import { Icon } from "../components/Icon";
import { Photo } from "../components/BlobImage";
import type { CatchEntry } from "../domain/types";

/**
 * M.O.C.-only end-of-tournament review. Fish that need an official ruling
 * (Trophy, Record Breaker, or a new "Other" species) are surfaced in an alert
 * at the top. Below, every angler's scorecard is collapsible (collapsed by
 * default) with per-catch decline / strike / rescore, a per-angler penalty
 * assessment, and a "validated" toggle that gates Publish Results.
 */
interface ScorecardsReviewPageProps {
  onBack?: () => void;
  /** When set, open + scroll to + highlight this angler's card (from the leaderboard). */
  focusUserId?: string | null;
  onFocusHandled?: () => void;
  /** Rendered as a section inside the M.O.C. Panel — drop the page wrapper + back button. */
  embedded?: boolean;
}

/** A catch that must be presented to the M.O.C. before its bonus/score is official. */
export function needsRuling(c: CatchEntry): boolean {
  if (c.status === "PENDING") return true; // new "Other" species
  return (c.isTrophy || c.isRecordBreaker) && c.status === "APPROVED" && !c.verifiedBy;
}

export function ScorecardsReviewPage({ onBack, focusUserId, onFocusHandled, embedded }: ScorecardsReviewPageProps) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const active = useLiveQuery(async () => {
    const list = await db.tournaments.where("year").equals(year).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [year]);
  const tournamentDate = active?.createdAt
    ? new Date(active.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "";
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);
  const catches = useLiveQuery(
    () => db.catches.where("tournamentYear").equals(year).toArray(),
    [year],
    [],
  );
  const penalties = useLiveQuery(
    () => db.penalties.where("tournamentYear").equals(year).toArray(),
    [year],
    [],
  );

  const [editLen, setEditLen] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [penDesc, setPenDesc] = useState<Record<string, string>>({});
  const [penPts, setPenPts] = useState<Record<string, string>>({});
  const focusedRef = useRef<HTMLDivElement | null>(null);
  const onFocusHandledRef = useRef(onFocusHandled);
  onFocusHandledRef.current = onFocusHandled;

  useEffect(() => {
    if (!focusUserId) return;
    setOpen((o) => (o[focusUserId] ? o : { ...o, [focusUserId]: true }));
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        focusedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    const t = setTimeout(() => onFocusHandledRef.current?.(), 3000);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t);
    };
  }, [focusUserId, catches]);

  if (user?.roleTag !== "MOC") {
    return (
      <div className={embedded ? undefined : "page"}>
        {onBack && <BackButton onBack={onBack} />}
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
  const canValidate = settings?.state === "ENDED" || settings?.state === "PUBLISHED";

  // Penalty deductions per angler.
  const penByUser = new Map<string, number>();
  for (const p of penalties) penByUser.set(p.userId, (penByUser.get(p.userId) ?? 0) + p.points);
  const penListByUser = new Map<string, typeof penalties>();
  for (const p of penalties) {
    const arr = penListByUser.get(p.userId) ?? [];
    arr.push(p);
    penListByUser.set(p.userId, arr);
  }

  const byAngler = new Map<string, CatchEntry[]>();
  for (const c of catches) {
    const arr = byAngler.get(c.userId) ?? [];
    arr.push(c);
    byAngler.set(c.userId, arr);
  }

  // Official standings (trash-3 cap, Full Monty, penalties, tie-breaks).
  const standings = computeStandings(catches, penByUser);
  const scoreByUser = new Map(standings.map((s) => [s.userId, s]));

  const rows = [...byAngler.entries()]
    .map(([uid, cs]) => {
      const u = users.find((x) => x.id === uid);
      const score = scoreByUser.get(uid);
      const total = score?.total ?? 0;
      const sorted = [...cs].sort((a, b) => b.createdAt - a.createdAt);
      const hasApproved = cs.some((c) => c.status === "APPROVED");
      return { uid, u, cs: sorted, total, score, hasApproved };
    })
    .sort((a, b) => b.total - a.total);

  const anglersToValidate = rows.filter((r) => r.hasApproved);
  const validatedCount = anglersToValidate.filter((r) => reviewed.has(r.uid)).length;

  // Fish awaiting an official M.O.C. ruling.
  const pending = catches
    .filter(needsRuling)
    .map((c) => ({ c, u: users.find((x) => x.id === c.userId) }))
    .sort((a, b) => b.c.createdAt - a.c.createdAt);

  const reasonFor = (c: CatchEntry) =>
    c.status === "PENDING"
      ? "New species — identify & score"
      : [c.isRecordBreaker ? "Record Breaker" : "", c.isTrophy ? "Trophy" : ""].filter(Boolean).join(" · ") +
        " — confirm official measurement";

  const toggleValidate = async (uid: string) => {
    if (!canValidate) return;
    const next = new Set(reviewed);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    await setReviewedAnglers([...next]);
  };

  const rescore = async (c: CatchEntry) => {
    const len = floorToQuarter(parseFloat(editLen[c.id] ?? ""));
    if (!records || !len || len <= 0) return;
    const s = scoreCatch(c.species, len, c.gearType, records);
    await overrideCatch(c.id, {
      lengthInches: len,
      pointValue: s.points,
      isTrophy: s.isTrophy,
      isRecordBreaker: s.isRecordBreaker,
      verifiedBy: "M.O.C. (official measurement)",
    });
    setEditLen((d) => ({ ...d, [c.id]: "" }));
  };
  const accept = async (id: string) => {
    const c = catches.find((x) => x.id === id);
    await decideCatch(id, "APPROVED", "M.O.C. — official");
    if (!c) return;
    const angler = users.find((u) => u.id === c.userId);
    await broadcast(
      `M.O.C. VERIFIED: ${angler?.name ?? "An angler"} landed a ${c.species}${c.gearType === "LURE" ? " on an artificial lure" : ""}!`,
    );
    // Settle every competing record-breaker catch for this species at once —
    // largest length keeps the record + bonus (earliest catch breaks a tie),
    // every other catch loses the bonus and is marked verified too.
    if (c.isRecordBreaker) await resolveRecordBreakers(c.species, c.tournamentYear);
  };
  const decline = (id: string) => decideCatch(id, "REJECTED", "M.O.C.");
  const reinstate = (id: string) => decideCatch(id, "APPROVED", "M.O.C.");
  const strike = (id: string) => {
    if (confirm("Strike this catch from the ledger entirely?")) deleteCatch(id);
  };

  const addPenalty = async (uid: string) => {
    const pts = parseFloat(penPts[uid] ?? "");
    const desc = (penDesc[uid] ?? "").trim();
    if (!pts || pts <= 0) return;
    await createPenalty({ userId: uid, tournamentYear: year, description: desc, points: pts });
    setPenDesc((d) => ({ ...d, [uid]: "" }));
    setPenPts((d) => ({ ...d, [uid]: "" }));
  };

  return (
    <div className={embedded ? undefined : "page"}>
      {onBack && <BackButton onBack={onBack} />}
      <div className="page-kicker" style={{ marginTop: embedded ? 0 : 12 }}>
        {active?.name ?? `S.R.C. ${year}`} · Season {year}{tournamentDate ? ` · ${tournamentDate}` : ""}
      </div>
      <h2 className="page-title">Scorecards</h2>
      <p className="page-sub">
        {!canValidate
          ? "Tournament is still live — validation opens once it's ended."
          : anglersToValidate.length === 0
            ? "The sea made shiners of everyone today!"
            : `${validatedCount}/${anglersToValidate.length} scorecards validated · updates live`}
      </p>

      {/* --- Needs your ruling: Trophy / Record / new-species fish --- */}
      {pending.length > 0 && (
        <div className="ruling-alert">
          <div className="ruling-head">
            <Icon name="bolt" size={18} />
            <b>
              {pending.length} fish {pending.length === 1 ? "needs" : "need"} your ruling
            </b>
          </div>
          {pending.map(({ c, u }) => (
            <div className="ruling-row" key={c.id}>
              <div style={{ display: "flex", gap: 10 }}>
                <Photo url={c.photoUrl} blob={c.photo} alt={c.species} className="glory-admin-thumb" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {c.species} · {c.lengthInches}"
                    <span style={{ color: "var(--sand-faint)", fontWeight: 400 }}>
                      {" "}— {u?.name ?? "Unknown"}
                    </span>
                  </div>
                  <div className="ruling-reason">{reasonFor(c)}</div>
                  {c.witnessId && (
                    <div className="ruling-reason">
                      Witness: {users.find((x) => x.id === c.witnessId)?.name ?? "Unknown"}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button className="btn small seafoam" style={{ flex: 1 }} onClick={() => accept(c.id)}>
                  <Icon name="check" size={14} /> Accept
                </button>
                <button className="btn small danger" style={{ flex: 1 }} onClick={() => decline(c.id)}>
                  <Icon name="x" size={14} /> Reject
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input
                  type="number"
                  step="0.25"
                  placeholder="Official inches"
                  value={editLen[c.id] ?? ""}
                  onChange={(e) => setEditLen((d) => ({ ...d, [c.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button className="btn small" style={{ flex: 1 }} onClick={() => rescore(c)}>
                  Rescore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="scorecard" size={30} />
          </div>
          {canValidate ? "The sea made shiners of everyone today!" : "No catches on the board yet."}
        </div>
      )}

      <div className="stagger">
        {rows.map(({ uid, u, cs, total, score }) => {
          const isOpen = !!open[uid];
          const pens = penListByUser.get(uid) ?? [];
          const deficit = penByUser.get(uid) ?? 0;
          return (
            <div
              className={`card ${focusUserId === uid ? "focus-flash" : ""}`}
              key={uid}
              ref={focusUserId === uid ? focusedRef : undefined}
              style={focusUserId === uid ? { scrollMarginTop: 84 } : undefined}
            >
              <button
                type="button"
                className="scorecard-head collapse-head"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [uid]: !o[uid] }))}
              >
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
                    {score?.fullMonty && <span className="tag honor">Full Monty</span>}
                    {deficit > 0 && <span className="tag danger">−{deficit.toLocaleString()} penalty</span>}
                    {score && score.trashCount > score.trashScored && (
                      <span className="tag" title="Only the best 3 trash fish score">
                        {score.trashScored}/{score.trashCount} trash
                      </span>
                    )}
                    <span className="muted-hint">· tap to {isOpen ? "hide" : "review"}</span>
                  </div>
                </div>
                <div className="total" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <b>{total.toLocaleString()}</b>
                    <span>points</span>
                  </div>
                  <Icon name="next" size={18} className={`collapse-chevron ${isOpen ? "open" : ""}`} />
                </div>
              </button>

              {isOpen && (
                <>
                  {cs.map((c) => {
                    const trashUncounted =
                      c.status === "APPROVED" && isTrash(c.species) && !score?.scoredTrashIds.includes(c.id);
                    return (
                      <div
                        className={`sc-row ${c.status !== "APPROVED" ? "dim" : ""}`}
                        key={c.id}
                        style={{ flexWrap: "wrap" }}
                      >
                        <Photo url={c.photoUrl} blob={c.photo} alt={c.species} className="glory-admin-thumb" />
                        <div className="sc-species">
                          {c.species}
                          <small>
                            {c.gearType === "LURE" ? "Artificial lure" : "Bait"}
                            {c.status === "REJECTED" ? " · declined" : ""}
                            {c.status === "PENDING" ? " · pending ruling" : ""}
                            {c.isTrophy ? " · Trophy" : ""}
                            {c.isRecordBreaker ? " · Record" : ""}
                            {trashUncounted ? " · not counted (best 3 only)" : ""}
                          </small>
                          {c.status !== "REJECTED" && <small className="sc-calc">{scoreCalc(c)}</small>}
                        </div>
                        <div className="sc-len">{c.lengthInches}"</div>
                        <div className="sc-pts">
                          {c.status !== "APPROVED" ? (
                            "—"
                          ) : trashUncounted ? (
                            <span style={{ textDecoration: "line-through", color: "var(--sand-faint)" }}>
                              +{c.pointValue.toLocaleString()}
                            </span>
                          ) : (
                            `+${c.pointValue.toLocaleString()}`
                          )}
                        </div>
                        <div style={{ flexBasis: "100%", display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                          {c.status !== "APPROVED" && (
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
                            style={{ width: 120, height: 44, flex: "0 0 auto" }}
                          />
                          <button className="btn small" onClick={() => rescore(c)}>
                            Rescore
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Penalty assessment */}
                  <div className="penalty-box">
                    <div className="penalty-title">
                      <Icon name="shield" size={14} /> Scoring deficit (penalty assessment)
                    </div>
                    {pens.map((p) => (
                      <div className="penalty-row" key={p.id}>
                        <span style={{ flex: 1, minWidth: 0 }}>{p.description || "Penalty"}</span>
                        <b style={{ color: "var(--danger, #ef4444)" }}>−{p.points.toLocaleString()}</b>
                        <button className="btn small ghost" onClick={() => deletePenalty(p.id)} title="Remove penalty">
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <input
                        placeholder="Reason (per the rules)"
                        value={penDesc[uid] ?? ""}
                        onChange={(e) => setPenDesc((d) => ({ ...d, [uid]: e.target.value }))}
                        style={{ flex: "1 1 140px", minWidth: 0 }}
                      />
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Points"
                        value={penPts[uid] ?? ""}
                        onChange={(e) => setPenPts((d) => ({ ...d, [uid]: e.target.value }))}
                        style={{ width: 96, flex: "0 0 auto" }}
                      />
                      <button className="btn small danger" onClick={() => addPenalty(uid)}>
                        Deduct
                      </button>
                    </div>
                  </div>

                  <button
                    className={`btn ${reviewed.has(uid) ? "ghost" : "seafoam"}`}
                    style={{ marginTop: 12 }}
                    disabled={!canValidate}
                    title={canValidate ? undefined : "Validation opens once the tournament has ended"}
                    onClick={() => toggleValidate(uid)}
                  >
                    <Icon name={reviewed.has(uid) ? "x" : "check"} size={16} />{" "}
                    {reviewed.has(uid) ? "Un-validate scorecard" : "Validate scorecard"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
