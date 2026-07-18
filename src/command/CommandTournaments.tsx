import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import {
  startTournament,
  endTournament,
  publishResults,
  startNewTournament,
  scheduleTournament,
  activateTournament,
  deleteTournament,
  renameTournament,
} from "../data/repository";
import { Icon } from "../components/Icon";
import { YEAR_CHAMPIONS } from "../domain/accolades";
import type { TournamentState } from "../domain/types";

const STATE_TAG: Record<TournamentState, string> = {
  SETUP: "",
  LIVE: "approved",
  ENDED: "pending",
  PUBLISHED: "honor",
};

/** Desktop tournament control + scheduling + history table (mobile keeps its
 * own card-based version — see TournamentAdmin/StartNewTournament/PastTournaments). */
export function CommandTournaments() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const approved = useLiveQuery(() => db.catches.filter((c) => c.status === "APPROVED").toArray(), [], []);
  const approvedThisYear = useLiveQuery(
    () => db.catches.where("tournamentYear").equals(year).and((c) => c.status === "APPROVED").toArray(),
    [year],
    [],
  );

  const active = tournaments.find((t) => t.year === year);
  const state: TournamentState = settings?.state ?? "SETUP";
  const reviewed = new Set(settings?.reviewedAnglers ?? []);
  const anglerIds = [...new Set(approvedThisYear.map((c) => c.userId))];
  const allValidated = anglerIds.length === 0 || anglerIds.every((id) => reviewed.has(id));

  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const usedYears = new Set(tournaments.map((t) => t.year));
  let suggested = new Date().getFullYear();
  while (usedYears.has(suggested)) suggested++;

  const [startName, setStartName] = useState("");
  const [startYear, setStartYear] = useState("");
  const startYearNum = parseInt(startYear || String(suggested), 10);

  const createNow = async () => {
    const nm = startName.trim();
    if (!nm) return;
    if (!confirm(`Start "${nm}" (${startYearNum})? The current tournament is archived and everyone starts fresh.`)) return;
    const anglers = users.filter((u) => u.roleTag !== "INACTIVE").map((u) => u.id);
    try {
      await run(() => startNewTournament({ name: nm, year: startYearNum, participantIds: anglers }));
      setStartName("");
      setStartYear("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't start the tournament.");
    }
  };

  const [schedName, setSchedName] = useState("");
  const [schedYear, setSchedYear] = useState("");
  const [schedAt, setSchedAt] = useState("");
  const schedYearNum = parseInt(schedYear || String(suggested + 1), 10);

  const schedule = async () => {
    const nm = schedName.trim();
    if (!nm || !schedAt) return;
    try {
      await run(() => scheduleTournament({ name: nm, year: schedYearNum, startAt: new Date(schedAt).getTime() }));
      setSchedName("");
      setSchedYear("");
      setSchedAt("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't schedule the tournament.");
    }
  };

  const champFor = (yr: number) => {
    const totals = new Map<string, number>();
    for (const c of approved) if (c.tournamentYear === yr) totals.set(c.userId, (totals.get(c.userId) ?? 0) + c.pointValue);
    let best: { id: string; pts: number } | null = null;
    for (const [id, pts] of totals) if (!best || pts > best.pts) best = { id, pts };
    if (best) return { name: users.find((u) => u.id === best!.id)?.name ?? "Unknown angler", pts: best.pts };

    // No live catch data for this year (pre-app seasons) — fall back to the
    // career-file archive, which has each angler's yearly total.
    const hist = YEAR_CHAMPIONS.find((c) => c.year === yr);
    return hist ? { name: hist.name, pts: hist.points } : null;
  };

  const sorted = [...tournaments].sort((a, b) => b.year - a.year);
  const cols = "72px 1fr 1fr 130px 200px";

  return (
    <div className="page">
      <h2 className="page-title">Tournaments</h2>
      <p className="page-sub">Run the active tournament and set up the next one.</p>

      {active && (
        <div
          className="card"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}
        >
          <div>
            <div className="page-kicker" style={{ marginTop: 0 }}>
              Active Tournament
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21 }}>{active.name}</span>
              <span className={`tag ${STATE_TAG[state]}`}>{state}</span>
            </div>
            <p style={{ color: "var(--sand-dim)", fontSize: 13.5, margin: "4px 0 0" }}>
              Season {year} · {approvedThisYear.length} approved catches
            </p>
          </div>
          <div>
            {state === "SETUP" && (
              <button className="btn seafoam" disabled={busy} onClick={() => run(startTournament)}>
                <Icon name="bolt" size={16} /> Open — go live
              </button>
            )}
            {state === "LIVE" && (
              <button
                className="btn danger"
                disabled={busy}
                onClick={() => {
                  if (confirm("End the tournament? Anglers can no longer log catches.")) run(endTournament);
                }}
              >
                <Icon name="check" size={16} /> End tournament
              </button>
            )}
            {state === "ENDED" && (
              <button
                className="btn seafoam"
                disabled={busy || !allValidated}
                title={allValidated ? undefined : "Validate every scorecard in Scorecards first"}
                onClick={() => {
                  if (confirm("Publish final results to everyone? This finalizes the record book.")) run(publishResults);
                }}
              >
                <Icon name="trophy" size={16} /> Publish results
              </button>
            )}
            {state === "PUBLISHED" && <span className="ok-note">Results are published.</span>}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 28, marginBottom: 4 }}>Set up a tournament</h3>
      <div className="cc-split">
        <div className="card">
          <h3>Start now</h3>
          <label className="field">
            <span>Name</span>
            <input value={startName} onChange={(e) => setStartName(e.target.value)} placeholder={`Sea Robin Classic ${suggested}`} />
          </label>
          <label className="field">
            <span>Year</span>
            <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder={String(suggested)} />
          </label>
          <button className="btn seafoam" disabled={busy || !startName.trim()} onClick={createNow}>
            Create &amp; make active
          </button>
          <p style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 8 }}>
            Becomes the active board immediately; the current tournament is archived.
          </p>
        </div>
        <div className="card">
          <h3>Schedule for later</h3>
          <label className="field">
            <span>Name</span>
            <input value={schedName} onChange={(e) => setSchedName(e.target.value)} placeholder={`Sea Robin Classic ${suggested + 1}`} />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <label className="field" style={{ flex: "1 1 100px" }}>
              <span>Year</span>
              <input type="number" value={schedYear} onChange={(e) => setSchedYear(e.target.value)} placeholder={String(suggested + 1)} />
            </label>
            <label className="field" style={{ flex: "1 1 160px" }}>
              <span>Start date &amp; time</span>
              <input type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} />
            </label>
          </div>
          <button className="btn" style={{ background: "var(--gold)" }} disabled={busy || !schedName.trim() || !schedAt} onClick={schedule}>
            <Icon name="pin" size={16} /> Schedule
          </button>
          <p style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 8 }}>
            Saved to the calendar; activate it when the day comes. Doesn't touch the live board.
          </p>
        </div>
      </div>

      <h3 style={{ marginTop: 28, marginBottom: 4 }}>History</h3>
      <div className="cc-catch-table">
        <div className="cc-catch-row cc-catch-head" style={{ gridTemplateColumns: cols }}>
          <div>Year</div>
          <div>Name</div>
          <div>Champion</div>
          <div>Total Points</div>
          <div />
        </div>
        {sorted.map((t) => {
          const isActive = t.year === year;
          const champ = champFor(t.year);
          return (
            <div className="cc-catch-row" style={{ gridTemplateColumns: cols }} key={t.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{t.year}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <input
                  defaultValue={t.name}
                  style={{ flex: 1, minWidth: 0 }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== t.name) renameTournament(t.id, v);
                  }}
                />
                {isActive && <span className="tag approved">ACTIVE</span>}
                {t.scheduledFor && <span className="tag pending">SCHEDULED</span>}
              </div>
              <div style={{ color: champ ? "var(--gold)" : "var(--sand-faint)", fontWeight: champ ? 700 : 400 }}>
                {champ ? champ.name : "—"}
              </div>
              <div style={{ color: champ ? "var(--gold)" : "var(--sand-faint)", fontWeight: champ ? 700 : 400 }}>
                {champ ? champ.pts.toLocaleString() : "—"}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {t.scheduledFor && (
                  <button
                    className="btn small seafoam"
                    onClick={() => {
                      if (confirm(`Activate "${t.name}" now? The current tournament will be archived.`)) run(() => activateTournament(t.id));
                    }}
                  >
                    Activate
                  </button>
                )}
                {/* Once a tournament has a recorded champion, it's real history —
                    only test/empty/scheduled entries stay removable. */}
                {!isActive && !champ && (
                  <button
                    className="btn small ghost"
                    onClick={() => {
                      if (
                        confirm(
                          `Remove "${t.name}" from history? ${t.scheduledFor ? "This cancels the scheduled tournament." : "The catches themselves are kept."}`,
                        )
                      )
                        deleteTournament(t.id);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p style={{ color: "var(--sand-faint)", fontSize: 14, padding: 20 }}>No tournaments yet.</p>}
      </div>
    </div>
  );
}
