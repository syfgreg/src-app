import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { broadcast, submitCatch } from "../data/repository";
import { useApp } from "../context/AppContext";
import { scoreCatch } from "../domain/scoring";
import { aiAvailable, verifyCatchPhoto, type CatchVerification } from "../ai/claude";
import { Icon } from "../components/Icon";
import type { GearType } from "../domain/types";

export function SubmitCatchPage({ onDone }: { onDone: () => void }) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);

  const [species, setSpecies] = useState("Sea Robin");
  const [length, setLength] = useState("");
  const [gearType, setGearType] = useState<GearType>("BAIT");
  const [photo, setPhoto] = useState<File | null>(null);
  const [useGps, setUseGps] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<CatchVerification | null>(null);

  const lengthNum = parseFloat(length);
  const cfg = settings?.species.find((s) => s.name === species);

  const preview = useMemo(() => {
    if (!settings || !records || !lengthNum || lengthNum <= 0) return null;
    return scoreCatch(species, lengthNum, gearType, settings, records);
  }, [settings, records, species, lengthNum, gearType]);

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
    if (!photo) return setError("Snap a photo of the catch on the sand — no photo, no points.");
    if (!lengthNum || lengthNum <= 0) return setError("Enter the measured length in inches.");
    if (lengthNum > 100) return setError("Over 100 inches? Take it up with the M.O.C. in person.");

    setBusy(true);
    try {
      // 1. AI verification (server-side, when the backend is live)
      let ai: CatchVerification | null = null;
      if (aiAvailable()) {
        setPhase("AI judge is inspecting your fish…");
        try {
          ai = await verifyCatchPhoto(photo, species, lengthNum, settings.species.map((s) => s.name));
          setVerdict(ai);
        } catch {
          ai = null; // verification unavailable — falls through to manual M.O.C. review
        }
      }

      // 2. Scoring engine
      setPhase("Calculating points…");
      const score = scoreCatch(species, lengthNum, gearType, settings, records);
      const pos = await getPosition();

      // 3. Persist (offline-first). Trophy/Record catches always await the
      //    M.O.C.'s official measurement per the rulebook.
      const needsMoc =
        score.isTrophy || score.isRecordBreaker || !ai || !ai.matchesClaim || ai.confidence < 0.75;
      const status = needsMoc ? "PENDING" : "APPROVED";

      await submitCatch({
        userId: user.id,
        tournamentYear: settings.tournamentYear,
        species,
        speciesDetected: ai?.speciesDetected,
        lengthInches: lengthNum,
        gearType,
        isSkate: !!cfg?.skate,
        isTrophy: score.isTrophy,
        isRecordBreaker: score.isRecordBreaker,
        pointValue: score.points,
        photo,
        lat: pos?.coords.latitude,
        lng: pos?.coords.longitude,
        aiConfidence: ai?.confidence,
        aiNotes: ai?.notes,
        status,
        createdAt: Date.now(),
      });

      if (status === "APPROVED") {
        await broadcast(
          `${user.name}${user.nickname ? ` "${user.nickname}"` : ""} just landed a ${species}${gearType === "LURE" ? " on an artificial lure" : ""}! (+${score.points.toLocaleString()} pts)`,
        );
      } else {
        await broadcast(
          `${user.name} submitted a ${species}${score.isRecordBreaker ? " — POTENTIAL RECORD BREAKER" : score.isTrophy ? " — Trophy candidate" : ""}. Awaiting the M.O.C.`,
        );
      }
      setPhase("");
      onDone();
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="page">
      <div className="page-kicker">On the sand</div>
      <h2 className="page-title">Log a Catch</h2>
      <p className="page-sub">
        Hooked, landed, identified, measured. Include the measuring device in the photo.
      </p>

      <div className="card">
        <label className="field">
          <span>Catch photo (measurement tape visible)</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Species</span>
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            {settings.species.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
                {s.tier === "SEA_ROBIN" ? " ⭐ (The Coveted)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>
            Length in inches {cfg?.skate ? "— wingtip to wingtip (Skate Clause)" : "— nose to tail"}
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
          <span>Gear — lure earns +{settings.lureBonusPPI} PPI bonus</span>
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
                must be presented to the M.O.C. for official measurement. Exact measurement only, no
                rounding.
              </span>
            </div>
          )}
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
        {busy ? phase || "Submitting…" : "Submit to the Ledger"}
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
