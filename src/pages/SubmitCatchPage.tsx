import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { broadcast, submitCatch } from "../data/repository";
import { useApp } from "../context/AppContext";
import { scoreCatch, speciesConfig, SPECIES_2026, SCORING, floorToQuarter } from "../domain/scoring";
import { aiAvailable, verifyCatchPhoto, type CatchVerification } from "../ai/claude";
import { Icon } from "../components/Icon";
import type { GearType } from "../domain/types";

export function SubmitCatchPage({ onDone }: { onDone: () => void }) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const activeTournament = useLiveQuery(async () => {
    const list = await db.tournaments.where("year").equals(year).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [year]);
  // If this tournament has a defined roster and the angler isn't on it, they sit out.
  // The M.O.C. always fishes regardless of the roster (see ScorecardPage's board).
  const roster = activeTournament?.participantIds ?? [];
  const notParticipant =
    !!user && user.roleTag !== "MOC" && roster.length > 0 && !roster.includes(user.id);

  // Sentinel for the "new species not on the list" path. Selecting it requires a
  // name + photo and routes the catch to the M.O.C. for final identification.
  const OTHER = "__OTHER__";

  const [species, setSpecies] = useState("Sea Robin");
  const [customSpecies, setCustomSpecies] = useState("");
  const [length, setLength] = useState("");
  const [gearType, setGearType] = useState<GearType>("BAIT");
  const [photo, setPhoto] = useState<File | null>(null);
  const [useGps, setUseGps] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<CatchVerification | null>(null);

  const isOther = species === OTHER;
  const finalSpecies = isOther ? customSpecies.trim() : species;
  // Round every measurement down to the nearest quarter inch before scoring.
  const lengthNum = floorToQuarter(parseFloat(length));
  const cfg = speciesConfig(finalSpecies);

  const preview = useMemo(() => {
    // New species aren't scored on submit — the M.O.C. identifies and scores them.
    if (isOther || !records || !lengthNum || lengthNum <= 0) return null;
    return scoreCatch(species, lengthNum, gearType, records);
  }, [isOther, records, species, lengthNum, gearType]);

  const onPhoto = (f: File | null) => {
    setPhoto(f);
    setVerdict(null);
  };

  const getPosition = () =>
    new Promise<GeolocationPosition | null>((resolve) => {
      if (!useGps || !("geolocation" in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { timeout: 5000 },
      );
    });

  const submit = async () => {
    if (!user || !settings || !records) return;
    setError(null);
    if (notParticipant) return setError("You're not on this tournament's roster. The M.O.C. sets who competes.");
    if (isOther && !finalSpecies) return setError("Name the new species so the M.O.C. can identify it.");
    if (!lengthNum || lengthNum <= 0) return setError("Enter the measured length in inches.");
    if (lengthNum > 100) return setError("Over 100 inches? Take it up with the M.O.C. in person.");
    // A new species needs a photo — the M.O.C. (with the AI's help) IDs it from the picture.
    if (isOther && !photo) return setError("A photo is required for a new species so the M.O.C. can verify it.");

    if ((settings.state ?? "SETUP") !== "LIVE") return setError("The tournament isn't open for submissions right now.");

    setBusy(true);
    try {
      // 1. AI verification (server-side, when the backend is live) — assists the
      //    M.O.C.'s review; it never gates approval and never has the final say.
      let ai: CatchVerification | null = null;
      if (aiAvailable() && photo) {
        setPhase("AI judge is inspecting your fish…");
        try {
          ai = await verifyCatchPhoto(photo, finalSpecies, lengthNum, SPECIES_2026.map((s) => s.name));
          setVerdict(ai);
        } catch {
          ai = null; // verification unavailable — falls through to manual M.O.C. review
        }
      }

      // 2. Scoring engine (provisional for a new species — the M.O.C. rescores).
      setPhase(isOther ? "Sending to the M.O.C.…" : "Calculating points…");
      const score = scoreCatch(finalSpecies, lengthNum, gearType, records);
      const pos = await getPosition();

      // 3. Persist (offline-first). Known species auto-approve and count on the
      //    board immediately; a new species routes to the M.O.C. as PENDING and
      //    stays off the board until they give final sign-off.
      const status = isOther ? ("PENDING" as const) : ("APPROVED" as const);

      await submitCatch({
        userId: user.id,
        tournamentYear: settings.tournamentYear,
        species: finalSpecies,
        speciesDetected: ai?.speciesDetected,
        lengthInches: lengthNum,
        gearType,
        isSkate: !!cfg?.skate,
        isTrophy: score.isTrophy,
        isRecordBreaker: score.isRecordBreaker,
        pointValue: score.points,
        photo: photo ?? undefined,
        lat: pos?.coords.latitude,
        lng: pos?.coords.longitude,
        aiConfidence: ai?.confidence,
        aiNotes: ai?.notes,
        status,
        createdAt: Date.now(),
      });

      // Only announce verified catches — and never with points (reveal at the end).
      // A pending new species stays quiet until the M.O.C. verifies it.
      if (status === "APPROVED") {
        await broadcast(
          `${user.name}${user.nickname ? ` "${user.nickname}"` : ""} just landed a ${finalSpecies}${gearType === "LURE" ? " on an artificial lure" : ""}!`,
        );
      }
      setPhase("");
      onDone();
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return null;

  const tState = settings.state ?? "SETUP";
  if (tState !== "LIVE") {
    const msg =
      tState === "SETUP"
        ? "The tournament hasn't started yet. Hold tight — the M.O.C. will drop the flag soon."
        : tState === "PUBLISHED"
          ? "The tournament is over and the results are official. Check the final standings!"
          : "Lines out — the tournament has ended. The M.O.C. is validating scorecards; results are coming.";
    return (
      <div className="page">
        <div className="page-kicker">On the sand</div>
        <h2 className="page-title">Log a Catch</h2>
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name={tState === "PUBLISHED" ? "trophy" : "waves"} size={30} />
          </div>
          {msg}
        </div>
      </div>
    );
  }

  if (notParticipant) {
    return (
      <div className="page">
        <div className="page-kicker">On the sand</div>
        <h2 className="page-title">Log a Catch</h2>
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="shield" size={30} />
          </div>
          You're not on this tournament's roster, so you can cheer from the beach but not log catches.
          The M.O.C. sets who competes.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-kicker">On the sand</div>
      <h2 className="page-title">Log a Catch</h2>
      <p className="page-sub">
        Hooked, landed, identified, measured. A photo is optional — but adding one with the measuring
        device visible lets the AI verify and score you instantly.
      </p>

      <div className="card">
        <label className="field">
          <span>
            {isOther
              ? "Catch photo — required for a new species (M.O.C. review)"
              : "Catch photo — optional (measuring device visible)"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
          />
          {!photo && (
            <small style={{ display: "block", color: "var(--sand-faint)", fontSize: 12, marginTop: 6 }}>
              {isOther
                ? "A photo is required — the M.O.C. (with the AI's help) identifies the fish from it."
                : "No photo? Your catch still counts — it just queues for the M.O.C.'s manual review."}
            </small>
          )}
        </label>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Species</span>
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            <optgroup label="The Coveted">
              {SPECIES_2026.filter((s) => s.category === "SEA_ROBIN").map((s) => (
                <option key={s.name} value={s.name}>{s.name} ⭐</option>
              ))}
            </optgroup>
            <optgroup label="Game Fish — Tier 1">
              {SPECIES_2026.filter((s) => s.category === "GAME_1").map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Game Fish — Tier 2">
              {SPECIES_2026.filter((s) => s.category === "GAME_2").map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Trash Fish (best 3 score)">
              {SPECIES_2026.filter((s) => s.category === "TRASH").map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
            <option value={OTHER}>Other — new species (M.O.C. review)…</option>
          </select>
        </label>

        {isOther && (
          <label className="field">
            <span>New species name</span>
            <input
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              placeholder="e.g. Northern Puffer, Tautog…"
              autoComplete="off"
            />
            <small style={{ display: "block", color: "var(--sand-faint)", fontSize: 12, marginTop: 6 }}>
              Not on the list? Add a photo and the M.O.C. gets the final call on the ID and points —
              the AI just advises.
            </small>
          </label>
        )}

        <label className="field">
          <span>
            Length in inches {cfg?.skate ? "— wingtip to wingtip" : "— nose to tail"}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder={cfg?.skate ? "24.5" : "17.25"}
          />
        </label>

        <label className="field">
          <span>Gear — an artificial lure adds +{SCORING.lureBonusPPI} PPI to game fish {SCORING.lureMinInches}" or greater</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["BAIT", "LURE"] as GearType[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`btn ${gearType === g ? "" : "ghost"}`}
                onClick={() => setGearType(g)}
              >
                {g === "BAIT" ? "Bait" : "Artificial Lure"}
              </button>
            ))}
          </div>
        </label>

        <label className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={useGps}
            onChange={(e) => setUseGps(e.target.checked)}
            style={{ width: "auto" }}
          />
          <span style={{ margin: 0 }}>Tag GPS location (boundary audit)</span>
        </label>
      </div>

      {preview && (
        <div className="card">
          <h3>Point calculation</h3>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--flare)" }}>
            +{preview.points.toLocaleString()} pts
          </div>
          <ul className="breakdown">
            {preview.breakdown.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {(preview.isTrophy || preview.isRecordBreaker) && (
            <div className="ai-verdict warn" style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Icon name={preview.isRecordBreaker ? "bolt" : "trophy"} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {preview.isRecordBreaker ? "Potential record breaker — " : "Trophy fish — "}
                must be presented to the M.O.C. for official measurement (rounded down to the nearest
                ¼&quot;).
              </span>
            </div>
          )}
        </div>
      )}

      {isOther && (
        <div className="ai-verdict warn" style={{ display: "flex", gap: 8 }}>
          <Icon name="shield" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            New species — this goes to the M.O.C. for review. The AI suggests an ID, but the M.O.C.
            has final sign-off and sets the points. It won't appear on the board until they approve it.
          </span>
        </div>
      )}

      {verdict && (
        <div
          className={`ai-verdict ${verdict.matchesClaim && verdict.confidence >= 0.75 ? "good" : "warn"}`}
          style={{ display: "flex", gap: 8 }}
        >
          <Icon name="sparkle" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            AI judge sees <strong>{verdict.speciesDetected}</strong> (
            {Math.round(verdict.confidence * 100)}% confident).{" "}
            {verdict.measurementVisible ? "Measuring device visible." : "No measuring device visible!"}{" "}
            {verdict.notes}
          </span>
        </div>
      )}

      {error && <p className="error-note">{error}</p>}
      <button className="btn" onClick={submit} disabled={busy} style={{ marginTop: 8 }}>
        {busy ? phase || "Submitting…" : isOther ? "Send to the M.O.C. for review" : "Submit to the Ledger"}
      </button>
      {!aiAvailable() && (
        <p style={{ color: "var(--sand-faint)", fontSize: 12.5, marginTop: 8 }}>
          AI verification is off{navigator.onLine ? " (backend not configured)" : " (offline)"}. Catches
          queue for manual M.O.C. review.
        </p>
      )}
      {!navigator.onLine && (
        <p className="ok-note">
          No signal — catch is saved to the local ledger and scored instantly. It syncs when the beach
          gives you bars.
        </p>
      )}
    </div>
  );
}
