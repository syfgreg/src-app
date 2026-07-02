import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import {
  broadcast,
  decideCatch,
  deleteCatch,
  overrideCatch,
  setNickname,
  setRole,
  updateRecord,
  updateSettings,
} from "../data/repository";
import { useApp } from "../context/AppContext";
import { scoreCatch } from "../domain/scoring";
import { CatchCard } from "../components/CatchCard";
import type { RoleTag, Settings } from "../domain/types";
import { ROLE_LABELS } from "../domain/types";

type Section = "catches" | "roster" | "scoring";

export function AdminPage({ onBack }: { onBack: () => void }) {
  const { user } = useApp();
  const [section, setSection] = useState<Section>("catches");

  if (user?.roleTag !== "MOC") {
    return (
      <div className="page">
        <button className="btn ghost small" onClick={onBack}>‹ Back</button>
        <div className="empty-state">
          <div className="big">🧿</div>
          The M.O.C. panel is for the M.O.C. All decisions are final.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="btn ghost small" onClick={onBack}>‹ Back</button>
      <div className="page-kicker" style={{ marginTop: 12 }}>Sole jurisdiction of the A.A.M.O.C.</div>
      <h2 className="page-title">M.O.C. Panel</h2>

      <div className="year-tabs">
        {(
          [
            ["catches", "Catches"],
            ["roster", "Roster"],
            ["scoring", "Scoring & AI"],
          ] as [Section, string][]
        ).map(([id, label]) => (
          <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
      </div>

      {section === "catches" && <CatchModeration />}
      {section === "roster" && <RosterAdmin />}
      {section === "scoring" && <ScoringAdmin />}
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
      await broadcast(
        `⚠️ M.O.C. VERIFIED: ${angler?.name ?? "An angler"} landed a ${c.lengthInches}" ${c.species}${c.gearType === "LURE" ? " on an artificial lure" : ""}! (+${c.pointValue.toLocaleString()} pts)${c.isRecordBreaker ? " ⚡ NEW SEA ROBIN RECORD!" : ""}`,
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
      await broadcast(`🚫 M.O.C. ruling: ${angler?.name ?? "an angler"}'s ${c.species} submission was rejected.`);
    }
  };

  const overrideLength = async (id: string) => {
    const c = await db.catches.get(id);
    const len = parseFloat(editLength[id] ?? "");
    if (!c || !settings || !records || !len || len <= 0) return;
    const rescored = scoreCatch(c.species, len, c.gearType, settings, records);
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
        <button className="btn small seafoam" onClick={() => decide(id, "APPROVED")}>✓ Approve</button>
        <button className="btn small danger" onClick={() => decide(id, "REJECTED")}>✕ Reject</button>
        <button className="btn small ghost" onClick={() => remove(id)}>🗑 Strike</button>
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

/* ---------- roster: role tags ---------- */
function RosterAdmin() {
  const users = useLiveQuery(() => db.users.toArray(), [], []);

  return (
    <div className="card">
      <h3>Roster ({users.length} / 24 + M.O.C.)</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Angler</th>
            <th>Nickname</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.name}
                <div style={{ color: "var(--sand-faint)", fontSize: 11 }}>{u.email}</div>
              </td>
              <td>
                <input
                  defaultValue={u.nickname ?? ""}
                  placeholder='"The Champ"'
                  onBlur={(e) => setNickname(u.id, e.target.value)}
                />
              </td>
              <td>
                <select value={u.roleTag} onChange={(e) => setRole(u.id, e.target.value as RoleTag)}>
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
  );
}

/* ---------- scoring config + AI + season ---------- */
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

  const patchSpecies = async (name: string, ppi: number) => {
    await patch({
      species: settings.species.map((s) => (s.name === name ? { ...s, pointsPerInch: ppi } : s)),
    });
  };

  const num = (v: string, fallback: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

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
        <label className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={settings.offSeasonMode}
            onChange={(e) => patch({ offSeasonMode: e.target.checked })}
            style={{ width: "auto" }}
          />
          <span style={{ margin: 0 }}>Off-season mode (Glory Pics feed active)</span>
        </label>
      </div>

      <div className="card">
        <h3>Bonuses &amp; clauses</h3>
        {(
          [
            ["lureBonusPPI", "Artificial lure bonus (PPI)"],
            ["trophyMinInches", "Trophy threshold (inches, gamefish over this)"],
            ["trophyBonus", "Trophy bonus (points)"],
            ["recordBreakerBonus", "Record Breaker bonus (points)"],
            ["skateBaselinePPI", "Skate Clause baseline (PPI)"],
          ] as [keyof Settings, string][]
        ).map(([key, label]) => (
          <label className="field" key={key as string}>
            <span>{label}</span>
            <input
              type="number"
              step="0.5"
              defaultValue={settings[key] as number}
              onBlur={(e) => patch({ [key]: num(e.target.value, settings[key] as number) } as Partial<Settings>)}
            />
          </label>
        ))}
      </div>

      <div className="card">
        <h3>Points per inch by species</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Tier</th>
              <th>PPI</th>
            </tr>
          </thead>
          <tbody>
            {settings.species.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td style={{ color: "var(--sand-faint)" }}>{s.tier.replace("_", " ")}</td>
                <td style={{ width: 90 }}>
                  <input
                    type="number"
                    defaultValue={s.pointsPerInch}
                    onBlur={(e) => patchSpecies(s.name, num(e.target.value, s.pointsPerInch))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>AI verification engine</h3>
        <p style={{ color: "var(--sand-dim)", fontSize: 14 }}>
          {cloud
            ? "AI vision verification and the full rules assistant run through the secure server function. The Anthropic API key is configured in the Netlify environment — never in the app or on any device."
            : "Running in local mode. Deploy to Netlify with ANTHROPIC_API_KEY set to enable AI catch verification and the full rules assistant. Until then, catches queue for your manual review and the assistant quotes the rulebook directly."}
        </p>
      </div>
      {saved && <p className="ok-note">Saved. The M.O.C.'s word is law.</p>}
    </>
  );
}
