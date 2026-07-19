import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import {
  broadcast,
  closeGloryVote,
  createInvite,
  decideCatch,
  deleteCatch,
  deleteInvite,
  deleteTournament,
  endTournament,
  nominateGlory,
  openGloryVoting,
  listBackups,
  publishGloryFav,
  reopenGloryVote,
  resetGloryVotes,
  overrideCatch,
  postGlory,
  publishResults,
  renameTournament,
  setNickname,
  setRole,
  setRosterOverride,
  startNewTournament,
  startTournament,
  unnominateGlory,
  updateRecord,
  updateSettings,
} from "../data/repository";
import { useApp } from "../context/AppContext";
import { scoreCatch, SCORING, SPECIES_2026, floorToQuarter } from "../domain/scoring";
import { CatchCard } from "../components/CatchCard";
import { BackButton } from "../components/BackButton";
import { Photo } from "../components/BlobImage";
import { Icon } from "../components/Icon";
import { ScorecardsReviewPage, needsRuling } from "./ScorecardsReviewPage";
import { HALL_OF_FAME } from "../domain/accolades";
import { computeStandings } from "../domain/standings";
import type { RoleTag, Settings } from "../domain/types";
import { ROLE_LABELS } from "../domain/types";

export type Section = "tournament" | "catches" | "scorecards" | "roster" | "glory" | "scoring" | "notifications";

interface AdminPageProps {
  onBack: () => void;
  /** Angler to focus in the Scorecards section (from the live leaderboard). */
  focusAngler?: string | null;
  onFocusHandled?: () => void;
  /** Open directly on a given tab instead of the default "tournament" (e.g. desktop Command Center deep links). */
  initialSection?: Section;
}

export function AdminPage({ onBack, focusAngler, onFocusHandled, initialSection }: AdminPageProps) {
  const { user } = useApp();
  const [section, setSection] = useState<Section>(initialSection ?? "tournament");
  const autoLanded = useRef(false);

  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const rulingCount = useLiveQuery(
    async () => (await db.catches.where("tournamentYear").equals(year).toArray()).filter(needsRuling).length,
    [year],
  );

  // Tapping an angler on the live leaderboard deep-links into the Scorecards tab.
  useEffect(() => {
    if (focusAngler) setSection("scorecards");
  }, [focusAngler]);

  // On first open, land on Current Scorecards if any card is awaiting a ruling.
  useEffect(() => {
    if (autoLanded.current || !settings || rulingCount === undefined) return;
    autoLanded.current = true;
    if (!focusAngler && rulingCount > 0) setSection("scorecards");
  }, [settings, rulingCount, focusAngler]);

  if (user?.roleTag !== "MOC") {
    return (
      <div className="page">
        <BackButton onBack={onBack} />
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="shield" size={30} />
          </div>
          The M.O.C. panel is for the M.O.C. All decisions are final.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>Sole jurisdiction of the A.A.M.O.C.</div>
      <h2 className="page-title">M.O.C. Panel</h2>

      <div className="year-tabs">
        {(
          [
            ["tournament", "Tournament"],
            ["scorecards", "Current Scorecards"],
            ["glory", "Glory Shot Voting"],
            ["roster", "Roster"],
            ["scoring", "Scoring & AI"],
            ["notifications", "Notifications"],
          ] as [Section, string][]
        ).map(([id, label]) => (
          <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
      </div>

      {section === "tournament" && (
        <>
          <TournamentAdmin />
          <StartNewTournament />
          <PastTournaments />
          <BackupNow />
        </>
      )}
      {section === "scorecards" && (
        <ScorecardsReviewPage embedded focusUserId={focusAngler} onFocusHandled={onFocusHandled} />
      )}
      {section === "catches" && <CatchModeration />}
      {section === "roster" && <RosterAdmin />}
      {section === "glory" && <GloryFavAdmin />}
      {section === "scoring" && <ScoringAdmin />}
      {section === "notifications" && <NotificationsAdmin />}
    </div>
  );
}

/* ---------- tournament lifecycle: open / end / publish ---------- */
const LIFECYCLE = [
  { key: "SETUP", label: "Setup" },
  { key: "LIVE", label: "Live" },
  { key: "ENDED", label: "Ended" },
  { key: "PUBLISHED", label: "Published" },
];
const NEXT_STEP: Record<string, string> = {
  SETUP: "Open the tournament so anglers can start logging catches.",
  LIVE: "Fishing is underway — end the tournament when the day is done.",
  ENDED: "Validate every scorecard in the Scorecards tab, then publish the results.",
  PUBLISHED: "All done — results are official. To run another, start a new tournament below.",
};

function Lifecycle({ state }: { state: string }) {
  const idx = LIFECYCLE.findIndex((s) => s.key === state);
  return (
    <div className="lifecycle" role="list" aria-label="Tournament stage">
      {LIFECYCLE.map((s, i) => (
        <div key={s.key} role="listitem" className={`lc-step ${i === idx ? "current" : ""} ${i < idx ? "done" : ""}`}>
          <span className="lc-dot">{i < idx ? <Icon name="check" size={12} /> : i + 1}</span>
          <span className="lc-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function TournamentAdmin() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const active = useLiveQuery(async () => {
    const list = await db.tournaments.where("year").equals(year).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [year]);
  const approved = useLiveQuery(
    () =>
      db.catches
        .where("tournamentYear")
        .equals(year)
        .and((c) => c.status === "APPROVED")
        .toArray(),
    [year],
    [],
  );
  const [busy, setBusy] = useState(false);
  if (!settings) return null;

  const state = settings.state ?? "SETUP";
  const reviewed = new Set(settings.reviewedAnglers ?? []);
  const anglerIds = [...new Set(approved.map((c) => c.userId))];
  const validatedCount = anglerIds.filter((id) => reviewed.has(id)).length;
  // Zero catches (a shutout tournament) counts as vacuously validated — nothing to review.
  const allValidated = anglerIds.length === 0 || anglerIds.every((id) => reviewed.has(id));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Tournament control</h3>
      <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0, marginBottom: 10 }}>
        Runs the current tournament — <b style={{ color: "var(--sand)" }}>{active?.name ?? `S.R.C. ${year}`}</b>. To
        begin a brand-new one, use “Start a new tournament” below.
      </p>

      <Lifecycle state={state} />

      <div className="next-step">
        <span>Next step</span>
        {NEXT_STEP[state]}
      </div>

      <div style={{ marginTop: 12 }}>
        {state === "SETUP" && (
          <button className="btn seafoam" disabled={busy} onClick={() => run(startTournament)}>
            <Icon name="bolt" size={16} /> Open tournament — go live
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
          <>
            <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginBottom: 8 }}>
              {anglerIds.length === 0
                ? "No catches were logged this tournament. The sea made lots of shiners today — you can publish directly."
                : (
                  <>
                    {validatedCount}/{anglerIds.length} scorecards validated.{" "}
                    {allValidated
                      ? "All clear — you can publish."
                      : "Validate every scorecard in the Scorecards view to enable publishing."}
                  </>
                )}
            </p>
            <button
              className="btn"
              disabled={busy || !allValidated}
              onClick={() => {
                if (confirm("Publish final results to everyone? This finalizes the record book."))
                  run(publishResults);
              }}
            >
              <Icon name="trophy" size={16} /> Publish results
            </button>
          </>
        )}

        {state === "PUBLISHED" && <p className="ok-note">Results are published. 🏆</p>}

        {state !== "SETUP" && (
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Reopen the current tournament back to Setup? Catches are kept, but anglers can’t log again until you re-open it. Use this only to correct a mistake — not to start next year's tournament.",
                )
              )
                run(() => updateSettings({ state: "SETUP", reviewedAnglers: [] }));
            }}
          >
            Reopen for setup
          </button>
        )}
      </div>
    </div>
  );
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- manual backup / results export ---------- */
function BackupNow() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [files, setFiles] = useState<Awaited<ReturnType<typeof listBackups>>>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const refreshFiles = async () => {
    setFilesLoading(true);
    try {
      setFiles(await listBackups());
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (showFiles) refreshFiles();
  }, [showFiles]);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/.netlify/functions/backup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const dest = data.driveConfigured ? "Supabase Storage + Google Drive" : "Supabase Storage (Google Drive not configured)";
      setMsg({ ok: true, text: `Backed up ${data.supabase?.length ?? 0} files to ${dest} · stamp ${data.ts}` });
      if (showFiles) refreshFiles();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Backup failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Backup &amp; results export</h3>
      <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0, marginBottom: 18 }}>
        Writes a timestamped, non-overwriting snapshot (full JSON backup + standings &amp; catches CSVs)
        to Supabase Storage and, when configured, your Google Drive folder. Runs automatically every day
        and on key events (tournament ended, results published, Glory Fav published).
      </p>
      <button className="btn" disabled={busy} onClick={run}>
        <Icon name="cloud" size={16} /> {busy ? "Backing up…" : "Backup & Export Now"}
      </button>
      {msg && <p className={msg.ok ? "ok-note" : "error-note"} style={{ marginTop: 8 }}>{msg.text}</p>}

      <button
        type="button"
        className="collapse-head"
        aria-expanded={showFiles}
        onClick={() => setShowFiles((o) => !o)}
        style={{ width: "100%", background: "none", border: 0, padding: "12px 0 4px", cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <span style={{ fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--sand-dim)" }}>
          Downloads
        </span>
        <Icon name="next" size={16} className={`collapse-chevron ${showFiles ? "open" : ""}`} style={{ marginLeft: "auto", color: "var(--sand-faint)" }} />
      </button>
      {showFiles && (
        <div style={{ marginTop: 8 }}>
          {filesLoading && <p style={{ color: "var(--sand-faint)", fontSize: 13 }}>Loading…</p>}
          {!filesLoading && files.length === 0 && (
            <p style={{ color: "var(--sand-faint)", fontSize: 13 }}>No backup files yet — run a backup above first.</p>
          )}
          {!filesLoading &&
            files.map((f) => (
              <div key={f.name} className="history-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                  <div style={{ color: "var(--sand-faint)", fontSize: 11 }}>
                    {fileSize(f.size)}
                    {f.createdAt ? ` · ${new Date(f.createdAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <a className="btn small ghost" href={f.url} download={f.name} title={`Download ${f.name}`}>
                  <Icon name="arrow-down" size={15} />
                </a>
              </div>
            ))}
          <p style={{ color: "var(--sand-faint)", fontSize: 11.5, marginTop: 8 }}>
            Links expire after an hour — reopen this list to refresh them.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- start a new tournament (name + participants) ---------- */
function StartNewTournament() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), [], []);
  // Every year that already has a tournament OR any catch is "taken" — a new
  // tournament must use a fresh year so its board is guaranteed empty.
  const catchYears = useLiveQuery(
    async () => [...new Set((await db.catches.toArray()).map((c) => c.tournamentYear))],
    [],
    [] as number[],
  );
  const currentYear = settings?.tournamentYear ?? new Date().getFullYear();

  const usedYears = new Set<number>([currentYear, ...tournaments.map((t) => t.year), ...catchYears]);
  let suggested = new Date().getFullYear();
  while (usedYears.has(suggested)) suggested += 1;

  // M.O.C. is selectable here on request — he's independently exempted from every
  // roster check elsewhere (submit, live board, Glory Fav voting), so this is purely
  // about letting him show up on his own participant list; it changes nothing else.
  const anglers = users.filter((u) => u.roleTag !== "INACTIVE");
  const [name, setName] = useState("");
  const [yearStr, setYearStr] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean> | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Preselect the whole roster once users load.
  const selected = picked ?? Object.fromEntries(anglers.map((u) => [u.id, true]));
  const setAll = (v: boolean) => setPicked(Object.fromEntries(anglers.map((u) => [u.id, v])));
  const toggle = (id: string) => setPicked({ ...selected, [id]: !selected[id] });
  const chosenIds = anglers.map((u) => u.id).filter((id) => selected[id]);

  const year = parseInt(yearStr || String(suggested), 10);
  const yearTaken = usedYears.has(year);

  const start = async () => {
    if (!name.trim() || yearTaken || !Number.isFinite(year)) return;
    if (
      !confirm(
        `Start "${name.trim()}" (${year}) with ${chosenIds.length} participants? The current tournament is saved to history and every participant starts on a clean, empty scorecard.`,
      )
    )
      return;
    setBusy(true);
    try {
      await startNewTournament({ name: name.trim(), year, participantIds: chosenIds });
      setName("");
      setYearStr("");
      setPicked(null);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't start the tournament.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Start a new tournament</h3>
      <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0 }}>
        Only for beginning a <b style={{ color: "var(--sand)" }}>brand-new</b> tournament (a new year). It
        archives the current one to history and gives every participant a clean, empty scorecard. You
        don’t need this to run the current tournament — use <b style={{ color: "var(--sand)" }}>Tournament
        control</b> above for that. After it’s created, open it from Tournament control to go live.
      </p>
      <label className="field">
        <span>Tournament name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Sea Robin Classic ${suggested}`}
        />
      </label>
      <label className="field">
        <span>Year (the tournament's unique id)</span>
        <input
          type="number"
          value={yearStr}
          placeholder={String(suggested)}
          onChange={(e) => setYearStr(e.target.value)}
        />
        {yearTaken && (
          <small style={{ color: "var(--gold)", fontSize: 12, marginTop: 4, display: "block" }}>
            {year} is already in use — a new tournament needs an unused year so every scorecard starts
            empty. Try {suggested}.
          </small>
        )}
      </label>

      <div className="field" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className="collapse-head"
          aria-expanded={showParticipants}
          onClick={() => setShowParticipants((o) => !o)}
          style={{ width: "100%", background: "none", border: 0, padding: "8px 0", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <span style={{ fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--sand-dim)" }}>
            Participants ({chosenIds.length}/{anglers.length})
          </span>
          <Icon name="next" size={16} className={`collapse-chevron ${showParticipants ? "open" : ""}`} style={{ marginLeft: "auto", color: "var(--sand-faint)" }} />
        </button>
        {showParticipants && (
          <>
            <div style={{ display: "flex", gap: 6, margin: "10px 0 8px" }}>
              <button type="button" className="btn small ghost" onClick={() => setAll(true)}>
                Select all
              </button>
              <button type="button" className="btn small ghost" onClick={() => setAll(false)}>
                Clear all
              </button>
            </div>
            <div className="participant-grid">
              {anglers.length === 0 && (
                <span style={{ color: "var(--sand-faint)", fontSize: 13 }}>No anglers on the roster yet.</span>
              )}
              {anglers.map((u) => (
                <label key={u.id} className="participant-chip">
                  <input
                    type="checkbox"
                    checked={!!selected[u.id]}
                    onChange={() => toggle(u.id)}
                    style={{ width: "auto" }}
                  />
                  <span>
                    {u.name}
                    {u.nickname ? ` "${u.nickname}"` : ""}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <button className="btn seafoam" disabled={busy || !name.trim() || yearTaken} onClick={start}>
        <Icon name="bolt" size={16} /> Archive current &amp; create new tournament
      </button>
      {done && (
        <p className="ok-note">
          New tournament created (Setup). Open it from Tournament control above to go live.
        </p>
      )}
    </div>
  );
}

/* ---------- past tournaments (history) ---------- */
function PastTournaments() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const approved = useLiveQuery(
    () => db.catches.filter((c) => c.status === "APPROVED").toArray(),
    [],
    [],
  );
  const penalties = useLiveQuery(() => db.penalties.toArray(), [], []);
  const [openYear, setOpenYear] = useState<number | null>(null);
  const currentYear = settings?.tournamentYear ?? new Date().getFullYear();

  // Full final standings for one past year, computed from the kept catches
  // (trash-3 cap, Full Monty, penalties, tie-breaks) — the official ordering.
  const standingsFor = (year: number) => {
    const penByUser = new Map<string, number>();
    for (const p of penalties) if (p.tournamentYear === year) penByUser.set(p.userId, (penByUser.get(p.userId) ?? 0) + p.points);
    return computeStandings(approved.filter((c) => c.tournamentYear === year), penByUser).map((s) => ({
      ...s,
      name: users.find((u) => u.id === s.userId)?.name ?? "Unknown angler",
    }));
  };

  // Champion (top total) per tournament year, from the kept catches.
  const championByYear = new Map<number, { name: string; pts: number }>();
  const totalsByYear = new Map<number, Map<string, number>>();
  for (const c of approved) {
    const m = totalsByYear.get(c.tournamentYear) ?? new Map<string, number>();
    m.set(c.userId, (m.get(c.userId) ?? 0) + c.pointValue);
    totalsByYear.set(c.tournamentYear, m);
  }
  for (const [yr, m] of totalsByYear) {
    let best: { id: string; pts: number } | null = null;
    for (const [id, pts] of m) if (!best || pts > best.pts) best = { id, pts };
    if (best) {
      const u = users.find((x) => x.id === best!.id);
      championByYear.set(yr, { name: u?.name ?? "—", pts: best.pts });
    }
  }

  const sorted = [...tournaments].sort((a, b) => b.year - a.year || b.createdAt - a.createdAt);

  return (
    <div className="card">
      <h3>Past tournaments ({tournaments.length})</h3>
      {sorted.length === 0 && (
        <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>
          No saved tournaments yet. The current one is archived automatically when you start a new one.
        </p>
      )}
      {sorted.map((t) => {
        const champ = championByYear.get(t.year);
        const isActive = t.year === currentYear;
        const isOpen = openYear === t.year;
        const standings = isOpen ? standingsFor(t.year) : [];
        return (
          <div key={t.id}>
            <div className="history-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  className="history-name"
                  defaultValue={t.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== t.name) renameTournament(t.id, v);
                  }}
                />
                <div style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 2 }}>
                  {t.year}
                  {isActive ? " · active" : ""}
                  {t.participantIds.length ? ` · ${t.participantIds.length} anglers` : ""}
                  {champ ? ` · 🏆 ${champ.name}` : " · no catches"}
                  {t.publishedAt
                    ? ` · published ${new Date(t.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                    : ""}
                </div>
              </div>
              <button
                className="btn small ghost"
                title="View final results"
                onClick={() => setOpenYear(isOpen ? null : t.year)}
                aria-expanded={isOpen}
              >
                <Icon name="next" size={15} className={`collapse-chevron ${isOpen ? "open" : ""}`} />
              </button>
              {!isActive && (
                <button
                  className="btn small ghost"
                  title="Remove from history (catches are kept)"
                  onClick={() => {
                    if (confirm(`Remove "${t.name}" from the history list? The catches themselves are kept.`))
                      deleteTournament(t.id);
                  }}
                >
                  <Icon name="trash" size={15} />
                </button>
              )}
            </div>
            {isOpen && (
              <div style={{ padding: "4px 0 12px" }}>
                {standings.length === 0 ? (
                  <p style={{ color: "var(--sand-faint)", fontSize: 13, margin: 0 }}>No scored catches this year.</p>
                ) : (
                  standings.map((s, i) => (
                    <div className="sc-row" key={s.userId}>
                      <div className="sc-species">
                        {i === 0 && (
                          <Icon name="trophy" size={13} style={{ color: "var(--gold)", marginRight: 5, verticalAlign: "-2px" }} />
                        )}
                        {i + 1}. {s.name}
                        {s.fullMonty ? <small> · Full Monty</small> : null}
                      </div>
                      <div className="sc-pts" style={i === 0 ? { color: "var(--gold)" } : undefined}>
                        {s.total.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- catches: approve / reject / override ---------- */
function CatchModeration() {
  const catches = useLiveQuery(() => db.catches.orderBy("createdAt").reverse().toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);
  const [editLength, setEditLength] = useState<Record<string, string>>({});

  const decide = async (id: string, status: "APPROVED" | "REJECTED") => {
    const c = await db.catches.get(id);
    if (!c) return;
    await decideCatch(id, status, "M.O.C.");
    const angler = users.find((u) => u.id === c.userId);
    if (status === "APPROVED") {
      // Points are never revealed in notifications — standings drop at Publish.
      await broadcast(
        `M.O.C. VERIFIED: ${angler?.name ?? "An angler"} landed a ${c.species}${c.gearType === "LURE" ? " on an artificial lure" : ""}!`,
      );
      // A verified record breaker rewrites the record book
      if (c.isRecordBreaker && angler) {
        const rec = records.find((r) => r.species.toLowerCase() === c.species.toLowerCase());
        if (rec) {
          await updateRecord(rec.species, {
            holder: angler.name,
            year: c.tournamentYear,
            lengthInches: c.lengthInches,
          });
        }
      }
    } else {
      await broadcast(`M.O.C. ruling: ${angler?.name ?? "an angler"}'s ${c.species} submission was rejected.`);
    }
  };

  const overrideLength = async (id: string) => {
    const c = await db.catches.get(id);
    const len = floorToQuarter(parseFloat(editLength[id] ?? ""));
    if (!c || !settings || !records || !len || len <= 0) return;
    const rescored = scoreCatch(c.species, len, c.gearType, records);
    await overrideCatch(id, {
      lengthInches: len,
      pointValue: rescored.points,
      isTrophy: rescored.isTrophy,
      isRecordBreaker: rescored.isRecordBreaker,
      verifiedBy: "M.O.C. (official measurement)",
    });
    setEditLength((d) => ({ ...d, [id]: "" }));
  };

  const remove = async (id: string) => {
    if (confirm("Strike this catch from the ledger entirely?")) await deleteCatch(id);
  };

  const pending = catches.filter((c) => c.status === "PENDING");
  const rest = catches.filter((c) => c.status !== "PENDING");

  const renderControls = (id: string) => (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button className="btn small seafoam" onClick={() => decide(id, "APPROVED")}>
          <Icon name="check" size={16} /> Approve
        </button>
        <button className="btn small danger" onClick={() => decide(id, "REJECTED")}>
          <Icon name="x" size={16} /> Reject
        </button>
        <button className="btn small ghost" onClick={() => remove(id)}>
          <Icon name="trash" size={16} /> Strike
        </button>
      </div>
      <div className="chat-input-row" style={{ marginTop: 8 }}>
        <input
          type="number"
          step="0.25"
          placeholder="Official inches (override & rescore)"
          value={editLength[id] ?? ""}
          onChange={(e) => setEditLength((d) => ({ ...d, [id]: e.target.value }))}
        />
        <button className="btn small" onClick={() => overrideLength(id)}>Rescore</button>
      </div>
    </div>
  );

  return (
    <>
      <h3 style={{ fontFamily: "var(--font-head)", textTransform: "uppercase", letterSpacing: 2, color: "var(--gold)", margin: "6px 0 10px" }}>
        Awaiting official measurement ({pending.length})
      </h3>
      {pending.length === 0 && <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>Nothing pending. The beach is honest today.</p>}
      {pending.map((c) => (
        <CatchCard key={c.id} entry={c} angler={users.find((u) => u.id === c.userId)}>
          {renderControls(c.id)}
        </CatchCard>
      ))}

      <h3 style={{ fontFamily: "var(--font-head)", textTransform: "uppercase", letterSpacing: 2, color: "var(--sand-dim)", margin: "18px 0 10px" }}>
        Full ledger ({rest.length})
      </h3>
      {rest.map((c) => (
        <CatchCard key={c.id} entry={c} angler={users.find((u) => u.id === c.userId)}>
          {renderControls(c.id)}
        </CatchCard>
      ))}
    </>
  );
}

/* ---------- notifications: free-text broadcast to everyone ---------- */
function NotificationsAdmin() {
  const LIMIT = 100;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    setBusy(true);
    try {
      await broadcast(msg, "M.O.C.");
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Send a broadcast</h3>
      <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0, marginBottom: 12 }}>
        Sent to every angler, exactly as written. Shows on iOS as "M.O.C. from Sea Robin."
      </p>
      <label className="field">
        <span>
          Message ({text.length}/{LIMIT})
        </span>
        <textarea
          rows={3}
          value={text}
          maxLength={LIMIT}
          onChange={(e) => setText(e.target.value)}
          placeholder="High tide moved up to 6pm — plan accordingly."
        />
      </label>
      <button className="btn" disabled={busy || !text.trim()} onClick={send}>
        <Icon name="send" size={16} /> {busy ? "Sending…" : "Send to everyone"}
      </button>
    </div>
  );
}

/* ---------- roster: invite new anglers + role tags ---------- */
function InviteAngler() {
  const { cloud } = useApp();
  const invites = useLiveQuery(() => db.invites.orderBy("createdAt").reverse().toArray(), [], []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTag, setRoleTag] = useState<RoleTag>("ANGLER");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setError(null);
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return setError("Enter a valid email address.");
    if (await db.users.where("email").equals(e).first()) return setError("That angler is already on the roster.");
    if (await db.invites.where("email").equals(e).first()) return setError("There's already a pending invite for that email.");
    setBusy(true);
    try {
      await createInvite({ email: e, name: name.trim() || undefined, roleTag });
      setName("");
      setEmail("");
      setRoleTag("ANGLER");
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Add an angler</h3>
      <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0 }}>
        Pre-register an angler and set their role. They finish sign-up themselves with this email and
        {cloud ? " inherit the role automatically." : " (local demo) the role applies on first login."}
      </p>
      <label className="field">
        <span>Name (optional)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sean Sullivan" />
      </label>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="angler@example.com"
          autoComplete="off"
        />
      </label>
      <label className="field">
        <span>Role</span>
        <select value={roleTag} onChange={(e) => setRoleTag(e.target.value as RoleTag)}>
          {(Object.keys(ROLE_LABELS) as RoleTag[])
            .filter((r) => r !== "INACTIVE")
            .map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
        </select>
      </label>
      {error && <p className="error-note">{error}</p>}
      <button className="btn seafoam" disabled={busy || !email.trim()} onClick={add}>
        <Icon name="plus" size={16} /> Add to roster
      </button>
      {done && <p className="ok-note">Invite created. They can register with that email.</p>}

      {invites.length > 0 && (
        <>
          <h3 style={{ marginTop: 18 }}>Pending invites ({invites.length})</h3>
          {invites.map((inv) => (
            <div key={inv.id} className="history-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{inv.name ?? inv.email}</div>
                <div style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 2 }}>
                  {inv.email} · {ROLE_LABELS[inv.roleTag]}
                </div>
              </div>
              <button className="btn small ghost" title="Cancel invite" onClick={() => deleteInvite(inv.id)}>
                <Icon name="x" size={15} />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// Historic club members to seed as INACTIVE (display-only, from the career data).
const INACTIVE_ROSTER = new Set(
  [
    "Nick Insley", "Tony Marandola", "John Dinlocker", "Kevin Tumola", "Ken Thompson",
    "Carlo Gambone", "Mike Hurrell", "Chris Coughlin", "Mason Keresty", "Karlos Gutierrez",
  ].map((n) => n.toLowerCase()),
);

interface RosterRow {
  key: string;
  name: string;
  detail: string;
  nickname?: string;
  roleTag: RoleTag;
  kind: "user" | "display";
}

function RosterAdmin() {
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const overrides = settings?.rosterOverrides ?? {};
  const norm = (s: string) => s.trim().toLowerCase();

  // One roster: real login accounts + historic members from the career data who
  // haven't registered (matched out by email/name so nobody appears twice).
  const emails = new Set(users.filter((u) => u.email).map((u) => norm(u.email)));
  const names = new Set(users.map((u) => norm(u.name)));

  const rows: RosterRow[] = [
    ...users.map((u) => ({
      key: u.id,
      name: u.name,
      detail: u.email,
      nickname: u.nickname,
      roleTag: u.roleTag,
      kind: "user" as const,
    })),
    ...HALL_OF_FAME.filter((a) => {
      const e = a.email ? norm(a.email) : "";
      return !(e && emails.has(e)) && !names.has(norm(a.name));
    }).map((a) => {
      const k = norm(a.name);
      const def: RoleTag = INACTIVE_ROSTER.has(k) ? "INACTIVE" : "ANGLER";
      return { key: k, name: a.name, detail: "not registered", roleTag: overrides[k] ?? def, kind: "display" as const };
    }),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const changeStatus = (row: RosterRow, role: RoleTag) =>
    row.kind === "user" ? setRole(row.key, role) : setRosterOverride(row.key, role);

  return (
    <>
      <InviteAngler />
      <div className="card">
        <h3>Roster ({rows.length})</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Angler</th>
              <th>Nickname</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td style={row.roleTag === "INACTIVE" ? { opacity: 0.5 } : undefined}>
                  {row.name}
                  <div style={{ color: "var(--sand-faint)", fontSize: 11 }}>{row.detail}</div>
                </td>
                <td>
                  {row.kind === "user" ? (
                    <input
                      defaultValue={row.nickname ?? ""}
                      placeholder='"The Champ"'
                      onBlur={(e) => setNickname(row.key, e.target.value)}
                    />
                  ) : (
                    <span style={{ color: "var(--sand-faint)" }}>—</span>
                  )}
                </td>
                <td>
                  <select value={row.roleTag} onChange={(e) => changeStatus(row, e.target.value as RoleTag)}>
                    {(Object.keys(ROLE_LABELS) as RoleTag[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Glory Shot Fav: curate the shots participants vote on ---------- */
function GloryFavAdmin() {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const pics = useLiveQuery(() => db.gloryPics.orderBy("createdAt").reverse().toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);

  const [photo, setPhoto] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const nominees = pics
    .filter((p) => p.nominatedYear === year)
    .sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0));
  const others = pics.filter((p) => p.nominatedYear !== year);
  const nameFor = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown angler";

  const gloryState = settings?.gloryFavState ?? "OFF";
  const totalVotes = nominees.reduce((n, p) => n + (p.votes?.length ?? 0), 0);
  const topVotes = nominees[0]?.votes?.length ?? 0;
  const GLORY_STATE_COPY: Record<string, string> = {
    OFF: "Not running. Add shots to the ballot below, then Publish for voting to open the polls.",
    OPEN: "Voting is live. Participants can vote; tallies are hidden from them.",
    CLOSED: "Voting is closed — no more ballots. Announce the winner, then publish.",
    PUBLISHED: "Results are published — everyone can see the winner on the Glory Shots page.",
  };

  const upload = async () => {
    if (!photo || !user) return;
    setBusy(true);
    try {
      await postGlory({ userId: user.id, photo, description: description.trim(), nominatedYear: year });
      setPhoto(null);
      setDescription("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card">
        <h3>Glory Shot — voting control</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 4px" }}>
          <span
            className="tag"
            style={{ background: "var(--gold)", color: "var(--on-accent)", borderColor: "var(--gold)" }}
          >
            {gloryState}
          </span>
          <span style={{ color: "var(--sand-dim)", fontSize: 13.5 }}>{GLORY_STATE_COPY[gloryState]}</span>
        </div>
        <p style={{ color: "var(--sand-dim)", fontSize: 13, margin: "6px 0 10px" }}>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} cast across {nominees.length}{" "}
          {nominees.length === 1 ? "shot" : "shots"} — results below are M.O.C. eyes only until you publish.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {gloryState === "OFF" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button
                className="btn seafoam"
                disabled={nominees.length === 0}
                onClick={() => openGloryVoting()}
              >
                <Icon name="bolt" size={16} /> Publish for voting
              </button>
              {nominees.length === 0 && (
                <small style={{ color: "var(--gold)", fontSize: 12 }}>
                  Add at least one shot to the ballot first.
                </small>
              )}
            </div>
          )}
          {gloryState === "OPEN" && (
            <button
              className="btn danger"
              onClick={() => {
                if (confirm("Close Glory Shot Fav voting? No more votes will be accepted.")) closeGloryVote();
              }}
            >
              <Icon name="check" size={16} /> Close voting
            </button>
          )}
          {gloryState === "CLOSED" && (
            <>
              <button
                className="btn"
                onClick={() => {
                  if (confirm("Publish the Glory Shot Fav results to everyone? Announce the winner first."))
                    publishGloryFav();
                }}
              >
                <Icon name="trophy" size={16} /> Publish results
              </button>
              <button className="btn ghost" onClick={() => reopenGloryVote(year)}>
                Re-open voting
              </button>
            </>
          )}
          {gloryState === "PUBLISHED" && (
            <button className="btn ghost" onClick={() => reopenGloryVote(year)}>
              Re-open voting
            </button>
          )}
        </div>
        {totalVotes > 0 && (
          <button
            className="btn ghost small"
            style={{ marginTop: 10 }}
            onClick={() => {
              if (confirm(`Clear all ${totalVotes} Glory Shot Fav ${totalVotes === 1 ? "vote" : "votes"}? Everyone (including you) can vote again from scratch. This can't be undone.`))
                resetGloryVotes(year);
            }}
          >
            <Icon name="trash" size={15} /> Clear all votes
          </button>
        )}
      </div>

      <div className="card">
        <h3>Glory Shot — the ballot</h3>
        <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0 }}>
          These are the shots participants vote on for <b>{year}</b>. Upload a new one below, or add an
          existing glory shot to the ballot. Only you see this panel; the vote itself is on the Glory
          Shots page for everyone.
        </p>

        {nominees.length === 0 ? (
          <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>No shots on the ballot yet.</p>
        ) : (
          nominees.map((p) => {
            const votes = p.votes?.length ?? 0;
            const leading = votes > 0 && votes === topVotes;
            return (
            <div key={p.id} className="history-row">
              <Photo url={p.photoUrl} blob={p.photo} alt="nominee" className="glory-admin-thumb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  {leading && <Icon name="trophy" size={14} />} {nameFor(p.userId)}
                </div>
                <div style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 2 }}>
                  {votes} {votes === 1 ? "vote" : "votes"}
                  {p.description ? ` · ${p.description}` : ""}
                </div>
              </div>
              <button
                className="btn small ghost"
                title="Remove from the ballot"
                onClick={() => {
                  if (confirm("Remove this shot from the ballot? Its votes are cleared."))
                    unnominateGlory(p.id);
                }}
              >
                <Icon name="x" size={15} />
              </button>
            </div>
          );})
        )}
      </div>

      <div className="card">
        <h3>Upload a shot to the ballot</h3>
        <label className="field">
          <span>Photo</span>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
        <label className="field">
          <span>Caption (optional)</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Best release of the day…"
          />
        </label>
        <button className="btn seafoam" onClick={upload} disabled={busy || !photo}>
          <Icon name="plus" size={16} /> Add to ballot
        </button>
      </div>

      <div className="card">
        <h3>Add from posted glory shots ({others.length})</h3>
        {others.length === 0 && (
          <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>No other glory shots have been posted.</p>
        )}
        {others.map((p) => (
          <div key={p.id} className="history-row">
            <Photo url={p.photoUrl} blob={p.photo} alt="glory shot" className="glory-admin-thumb" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{nameFor(p.userId)}</div>
              <div style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 2 }}>
                {p.description || "No caption"}
              </div>
            </div>
            <button className="btn small seafoam" onClick={() => nominateGlory(p.id, year)}>
              <Icon name="plus" size={15} /> Ballot
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- scoring reference + AI + season ---------- */
function ScoringAdmin() {
  const { cloud } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const [saved, setSaved] = useState(false);
  if (!settings) return null;

  const patch = async (changes: Partial<Settings>) => {
    await updateSettings(changes);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const num = (v: string, fallback: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  const bandText = (bands: { maxExclusive: number | null; ppi: number }[]) =>
    bands
      .map((b, i) => {
        const lo = i === 0 ? 0 : bands[i - 1].maxExclusive;
        return b.maxExclusive === null ? `${lo}"+ → ${b.ppi}` : `${lo}"–<${b.maxExclusive}" → ${b.ppi}`;
      })
      .join(" · ");

  const categories = SPECIES_2026.reduce<Record<string, string[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s.name);
    return acc;
  }, {});

  return (
    <>
      <div className="card">
        <h3>Tournament</h3>
        <label className="field">
          <span>Tournament year</span>
          <input
            type="number"
            defaultValue={settings.tournamentYear}
            onBlur={(e) => patch({ tournamentYear: num(e.target.value, settings.tournamentYear) })}
          />
        </label>
      </div>

      <div className="card">
        <h3>2026 point system (per inch)</h3>
        <p style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 0 }}>
          Fixed by the Official 2026 Scorecard — the app scores every catch exactly like the paper card.
        </p>
        <table className="admin-table">
          <tbody>
            <tr>
              <td><b>The Coveted Sea Robin</b></td>
              <td>{SCORING.seaRobinPPI} PPI, any size</td>
            </tr>
            <tr>
              <td><b>Game Fish — Tier 1</b></td>
              <td>{bandText(SCORING.tier1Bands)}</td>
            </tr>
            <tr>
              <td><b>Game Fish — Tier 2</b></td>
              <td>{bandText(SCORING.tier2Bands)}</td>
            </tr>
            <tr>
              <td><b>Trash Fish</b> (best {SCORING.trashScorableLimit})</td>
              <td>{bandText(SCORING.trashBands)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Bonus opportunities</h3>
        <ul className="breakdown">
          <li>Lure: +{SCORING.lureBonusPPI} PPI — game fish ≥ {SCORING.lureMinInches}" on a bona-fide artificial (no bait)</li>
          <li>Trophy: +{SCORING.trophyBonusPPI} PPI — game fish over {SCORING.trophyMinInches}" (M.O.C. measured)</li>
          <li>Record Breaker: +{SCORING.recordBreakerBonusPPI} PPI — beats the standing record (M.O.C. measured)</li>
          <li>The Full Monty: +{SCORING.fullMontyBonus.toLocaleString()} — largest game fish AND largest trash fish</li>
        </ul>
      </div>

      <div className="card">
        <h3>Species categories</h3>
        <table className="admin-table">
          <tbody>
            {(
              [
                ["SEA_ROBIN", "The Coveted"],
                ["GAME_1", "Game — Tier 1"],
                ["GAME_2", "Game — Tier 2"],
                ["TRASH", "Trash"],
              ] as [string, string][]
            ).map(([cat, label]) => (
              <tr key={cat}>
                <td style={{ whiteSpace: "nowrap", verticalAlign: "top" }}><b>{label}</b></td>
                <td style={{ color: "var(--sand-dim)" }}>{(categories[cat] ?? []).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: "var(--sand-faint)", fontSize: 12, marginTop: 8 }}>
          A fish not on this list is logged via "Other" and categorized/scored by you on review.
        </p>
      </div>

      <div className="card">
        <h3>AI verification engine</h3>
        <p style={{ color: "var(--sand-dim)", fontSize: 14 }}>
          {cloud
            ? "AI vision verification and the full rules assistant run through the secure server function on Google Gemini. The GEMINI_API_KEY is configured in the Netlify environment — never in the app or on any device."
            : "Running in local mode. Deploy to Netlify with GEMINI_API_KEY set to enable AI catch verification and the full rules assistant. Until then, catches queue for your manual review and the assistant quotes the rulebook directly."}
        </p>
      </div>
      {saved && <p className="ok-note">Saved. The M.O.C.'s word is law.</p>}
    </>
  );
}
