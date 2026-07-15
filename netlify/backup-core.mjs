// Backup + results-export engine (shared by the scheduled and HTTP functions).
//
// Two destinations, both timestamped and NEVER overwritten:
//   • Supabase Storage bucket "backups" (raw, restorable):
//       - backup-<ts>.json           full snapshot of every table
//       - results-standings-<ts>.csv official standings for the active tournament
//       - results-catches-<ts>.csv   full catch ledger
//   • Google Drive folder (human-friendly): a NEW native Google Sheet per run,
//     "SRC Backup <ts>", with three formatted tabs:
//       - Career Leaderboard  (all-time, from domain/accolades.ts)
//       - Current Tournament  (live standings, from domain/standings.ts)
//       - Scorecard Detail    (every catch: species, size, gear, points, status)
//
// Google Drive auth uses an OAuth refresh token for the USER's own account
// (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN) so the files
// are owned by the user — a service account can't write to a personal Drive.
import { createClient } from "@supabase/supabase-js";
import { computeStandings } from "../src/domain/standings";
import { HALL_OF_FAME, shinerSeasons, presidencyYears } from "../src/domain/accolades";

const TABLES = [
  "profiles", "settings", "records", "catches", "glory_pics",
  "newsletters", "tournaments", "invites", "penalties", "notifications",
];

/** Filename-safe UTC timestamp, e.g. 2026-07-11T18-30-00-000Z. */
function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows) {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

async function fetchAll(supabase) {
  const out = {};
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) throw new Error(`read ${t}: ${error.message}`);
    out[t] = data ?? [];
  }
  return out;
}

// ---------- shared data shaping ---------------------------------------------
function mapCatches(data) {
  return (data.catches ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    tournamentYear: r.tournament_year,
    species: r.species,
    lengthInches: Number(r.length_inches),
    gearType: r.gear_type,
    isSkate: !!r.is_skate,
    isTrophy: !!r.is_trophy,
    isRecordBreaker: !!r.is_record_breaker,
    pointValue: Number(r.point_value),
    status: r.status,
    createdAt: Date.parse(r.created_at) || 0,
  }));
}

/** Live standings for the active tournament year, plus lookup helpers. */
function currentContext(data) {
  const catches = mapCatches(data);
  const year = data.settings?.[0]?.tournament_year;
  const scoped = year == null ? catches : catches.filter((c) => c.tournamentYear === year);
  const penByUser = new Map();
  for (const p of data.penalties ?? []) {
    if (year != null && p.tournament_year !== year) continue;
    penByUser.set(p.user_id, (penByUser.get(p.user_id) ?? 0) + Number(p.points));
  }
  const standings = computeStandings(scoped, penByUser);
  const byId = new Map((data.profiles ?? []).map((p) => [p.id, p]));
  const tourneys = (data.tournaments ?? [])
    .filter((t) => t.year === year)
    .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
  const tname = tourneys[0]?.name ?? `S.R.C. ${year ?? ""}`.trim();
  return { standings, byId, year, tname };
}

// ---------- CSV builders (Supabase Storage) ---------------------------------
export function buildStandingsCsv(data) {
  const { standings, byId } = currentContext(data);
  const header = ["rank", "angler", "nickname", "total", "fullMonty", "penalty", "approvedCatches", "gameCount", "trashCount"];
  const rows = standings.map((s, i) => {
    const u = byId.get(s.userId);
    return [i + 1, u?.name ?? "Unknown", u?.nickname ?? "", s.total, s.fullMonty ? "yes" : "", s.penalty, s.approvedCount, s.gameCount, s.trashCount];
  });
  return toCsv([header, ...rows]);
}

export function buildCatchesCsv(data) {
  const nameById = new Map((data.profiles ?? []).map((p) => [p.id, p.name]));
  const header = ["angler", "species", "length_in", "gear", "points", "status", "trophy", "record", "tournament_year", "created_at"];
  const rows = (data.catches ?? []).map((r) => [
    nameById.get(r.user_id) ?? r.user_id,
    r.species, r.length_inches, r.gear_type, r.point_value, r.status,
    r.is_trophy ? "yes" : "", r.is_record_breaker ? "yes" : "", r.tournament_year, r.created_at,
  ]);
  return toCsv([header, ...rows]);
}

// ---------- Google Sheet tab builders (Drive) -------------------------------
export function careerRows() {
  const sorted = [...HALL_OF_FAME].sort((a, b) => (b.careerTotal || 0) - (a.careerTotal || 0));
  const rows = [
    ["SRC ANGLER STANDINGS — CAREER LEADERBOARD"],
    [`${sorted.length} Anglers · Career totals across Sea Robin Classic history`],
    [],
    ["ANGLER ACCOLADES — CAREER LEADERBOARD"],
    ["Rank", "Angler", "Career Points", "Championships", "Records Held", "Years Active", "Shiner Seasons", "Shiner Club President"],
  ];
  sorted.forEach((a, i) => {
    const tag = a.grandRobin ? " (GR)" : a.moc ? " (MOC)" : "";
    rows.push([
      i + 1,
      a.name + tag,
      a.careerTotal || "-",
      a.championships || "-",
      a.recordsHeld || "-",
      a.years || 0,
      shinerSeasons(a) || "-",
      presidencyYears(a).length || "-",
    ]);
  });
  return rows;
}

export function careerStatsRows() {
  const n = HALL_OF_FAME.length;
  const total = HALL_OF_FAME.reduce((s, a) => s + (a.careerTotal || 0), 0);
  const champs = HALL_OF_FAME.reduce((s, a) => s + (a.championships || 0), 0);
  const withRecords = HALL_OF_FAME.filter((a) => (a.recordsHeld || 0) > 0).length;
  const top = [...HALL_OF_FAME].sort((a, b) => (b.championships || 0) - (a.championships || 0))[0];
  return [
    ["KEY STATISTICS", ""],
    ["All-Time Total Points", Math.round(total)],
    ["Anglers Tracked", n],
    ["Average Career Points", n ? Math.round(total / n) : 0],
    ["Total Championships", champs],
    ["Anglers with Records", withRecords],
    ["Top Champion", top ? `${top.name} (${top.championships})` : "—"],
  ];
}

export function currentRows(data) {
  const { standings, byId, year, tname } = currentContext(data);
  const rows = [
    [tname],
    [`Season ${year ?? ""} · Current Standings`],
    [],
    ["Rank", "Angler", "Nickname", "Total", "Full Monty", "Penalty", "Approved Catches", "Game", "Trash"],
  ];
  standings.forEach((s, i) => {
    const u = byId.get(s.userId);
    rows.push([i + 1, u?.name ?? "Unknown", u?.nickname ?? "", s.total, s.fullMonty ? "Yes" : "", s.penalty || 0, s.approvedCount, s.gameCount, s.trashCount]);
  });
  if (standings.length === 0) rows.push(["—", "No catches on the board yet"]);
  return rows;
}

export function scorecardRows(data) {
  const nameById = new Map((data.profiles ?? []).map((p) => [p.id, p.name]));
  const cs = [...(data.catches ?? [])].sort(
    (a, b) => (b.tournament_year - a.tournament_year) || ((Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0)),
  );
  const rows = [
    ["SCORECARD — CATCH DETAIL"],
    ["Every logged catch · species, size, gear, points, status"],
    [],
    ["Angler", "Species", "Length (in)", "Gear", "Points", "Status", "Trophy", "Record", "Tournament", "Logged"],
  ];
  cs.forEach((r) => {
    rows.push([
      nameById.get(r.user_id) ?? r.user_id,
      r.species,
      Number(r.length_inches),
      r.gear_type === "LURE" ? "Artificial lure" : "Bait",
      Number(r.point_value),
      r.status,
      r.is_trophy ? "Yes" : "",
      r.is_record_breaker ? "Yes" : "",
      r.tournament_year,
      r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
    ]);
  });
  if (cs.length === 0) rows.push(["—", "No catches logged"]);
  return rows;
}

// ---------- Google Drive: create a formatted native Sheet -------------------
async function googleAccessToken() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null; // Drive not configured — Supabase-only run
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`google auth ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

const HEADER_BG = { red: 0.13, green: 0.16, blue: 0.2 };
const WHITE = { red: 1, green: 1, blue: 1 };

function titleFmt(sheetId, row = 0, size = 13) {
  return { repeatCell: { range: { sheetId, startRowIndex: row, endRowIndex: row + 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: size } } }, fields: "userEnteredFormat.textFormat" } };
}
function headerFmt(sheetId, row) {
  return { repeatCell: { range: { sheetId, startRowIndex: row, endRowIndex: row + 1 }, cell: { userEnteredFormat: { backgroundColor: HEADER_BG, textFormat: { bold: true, foregroundColor: WHITE } } }, fields: "userEnteredFormat(backgroundColor,textFormat)" } };
}
function numFmt(sheetId, startRow, col) {
  return { repeatCell: { range: { sheetId, startRowIndex: startRow, startColumnIndex: col, endColumnIndex: col + 1 }, cell: { userEnteredFormat: { numberFormat: { type: "NUMBER", pattern: "#,##0" } } }, fields: "userEnteredFormat.numberFormat" } };
}
function autosize(sheetId, cols) {
  return { autoResizeDimensions: { dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: cols } } };
}

async function createResultsSheet(token, folderId, data, ts) {
  const call = (url, body, method = "POST") =>
    fetch(url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

  // 1. Create the spreadsheet with three tabs.
  const title = `SRC Backup ${ts}`;
  let res = await call("https://sheets.googleapis.com/v4/spreadsheets", {
    properties: { title },
    sheets: [
      { properties: { sheetId: 0, title: "Career Leaderboard", gridProperties: { frozenRowCount: 5 } } },
      { properties: { sheetId: 1, title: "Current Tournament", gridProperties: { frozenRowCount: 4 } } },
      { properties: { sheetId: 2, title: "Scorecard Detail", gridProperties: { frozenRowCount: 4 } } },
    ],
  });
  if (!res.ok) throw new Error(`sheets create ${res.status}: ${await res.text()}`);
  const { spreadsheetId } = await res.json();

  // 2. Write values into each tab.
  res = await call(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    valueInputOption: "USER_ENTERED",
    data: [
      { range: "Career Leaderboard!A1", values: careerRows() },
      { range: "Career Leaderboard!H4", values: careerStatsRows() },
      { range: "Current Tournament!A1", values: currentRows(data) },
      { range: "Scorecard Detail!A1", values: scorecardRows(data) },
    ],
  });
  if (!res.ok) throw new Error(`sheets values ${res.status}: ${await res.text()}`);

  // 3. Formatting: bold titles, header rows, number columns, autosize.
  const requests = [
    titleFmt(0), { repeatCell: { range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat" } },
    headerFmt(0, 4), numFmt(0, 5, 2), autosize(0, 8),
    titleFmt(1), headerFmt(1, 3), numFmt(1, 4, 3), numFmt(1, 4, 5), autosize(1, 9),
    titleFmt(2), headerFmt(2, 3), numFmt(2, 4, 2), numFmt(2, 4, 4), autosize(2, 10),
    // Career stats side block header
    { repeatCell: { range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 7, endColumnIndex: 9 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat" } },
  ];
  res = await call(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, { requests });
  if (!res.ok) throw new Error(`sheets format ${res.status}: ${await res.text()}`);

  // 4. Move the new sheet into the target Drive folder.
  if (folderId) {
    res = await call(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&removeParents=root&supportsAllDrives=true&fields=id`, null, "PATCH");
    if (!res.ok) throw new Error(`drive move ${res.status}: ${await res.text()}`);
  }
  return { title, spreadsheetId };
}

// ---------- Supabase Storage ------------------------------------------------
async function storageUpload(supabase, name, contentType, body) {
  await supabase.storage.createBucket("backups", { public: false }).catch(() => {}); // idempotent
  const { error } = await supabase.storage.from("backups").upload(name, body, { contentType, upsert: false });
  if (error && !/exists|duplicate/i.test(error.message)) throw error;
}

/** Run one full backup + export. Returns a summary. */
export async function runBackup() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var.");
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const data = await fetchAll(supabase);
  const ts = stamp();

  // Raw backup → Supabase Storage.
  const files = [
    { name: `backup-${ts}.json`, type: "application/json", body: JSON.stringify({ exportedAt: new Date().toISOString(), tables: data }, null, 2) },
    { name: `results-standings-${ts}.csv`, type: "text/csv", body: buildStandingsCsv(data) },
    { name: `results-catches-${ts}.csv`, type: "text/csv", body: buildCatchesCsv(data) },
  ];
  const summary = { ts, supabase: [], sheet: null, driveConfigured: false };
  for (const f of files) {
    await storageUpload(supabase, f.name, f.type, f.body);
    summary.supabase.push(f.name);
  }

  // Formatted Google Sheet → Drive (if OAuth + folder configured).
  const token = await googleAccessToken();
  const folderId = process.env.GDRIVE_FOLDER_ID;
  if (token) {
    summary.driveConfigured = true;
    const sheet = await createResultsSheet(token, folderId, data, ts);
    summary.sheet = sheet.title;
  }
  return summary;
}
