import { db, osNotify } from "./db";
import { cloudEnabled } from "./supabase";
import { remoteWrite } from "./sync";
import type {
  CatchEntry,
  GloryComment,
  GloryPic,
  RoleTag,
  Settings,
} from "../domain/types";

/**
 * Write layer. Every mutation updates the local Dexie mirror immediately (so
 * the UI reacts and offline works) and enqueues a durable write to Supabase.
 * In local-only mode remoteWrite is a no-op and Dexie is the source of truth.
 */

const now = () => Date.now();
const uuid = () => crypto.randomUUID();

const catchPayload = (c: CatchEntry) => ({
  id: c.id,
  user_id: c.userId,
  tournament_year: c.tournamentYear,
  species: c.species,
  species_detected: c.speciesDetected ?? null,
  length_inches: c.lengthInches,
  gear_type: c.gearType,
  is_skate: c.isSkate,
  is_trophy: c.isTrophy,
  is_record_breaker: c.isRecordBreaker,
  point_value: c.pointValue,
  lat: c.lat ?? null,
  lng: c.lng ?? null,
  ai_confidence: c.aiConfidence ?? null,
  ai_notes: c.aiNotes ?? null,
  status: c.status,
  verified_by: c.verifiedBy ?? null,
});

export async function submitCatch(entry: Omit<CatchEntry, "id">): Promise<CatchEntry> {
  const full: CatchEntry = { ...entry, id: uuid() };
  await db.catches.put(full); // keeps the blob locally for instant/offline display
  await remoteWrite({
    table: "catches",
    op: "upsert",
    key: full.id,
    payload: catchPayload(full),
    photo: entry.photo,
    photoBucket: "catch-photos",
    photoField: "photo_url",
    at: full.createdAt,
  });
  return full;
}

export async function decideCatch(id: string, status: "APPROVED" | "REJECTED", verifiedBy: string) {
  await db.catches.update(id, { status, verifiedBy });
  await remoteWrite({
    table: "catches",
    op: "update",
    key: id,
    payload: { status, verified_by: verifiedBy },
    at: now(),
  });
}

export async function overrideCatch(
  id: string,
  changes: Partial<Pick<CatchEntry, "lengthInches" | "pointValue" | "isTrophy" | "isRecordBreaker" | "verifiedBy">>,
) {
  await db.catches.update(id, changes);
  const payload: Record<string, unknown> = {};
  if (changes.lengthInches != null) payload.length_inches = changes.lengthInches;
  if (changes.pointValue != null) payload.point_value = changes.pointValue;
  if (changes.isTrophy != null) payload.is_trophy = changes.isTrophy;
  if (changes.isRecordBreaker != null) payload.is_record_breaker = changes.isRecordBreaker;
  if (changes.verifiedBy != null) payload.verified_by = changes.verifiedBy;
  await remoteWrite({ table: "catches", op: "update", key: id, payload, at: now() });
}

export async function deleteCatch(id: string) {
  await db.catches.delete(id);
  await remoteWrite({ table: "catches", op: "delete", key: id, payload: {}, at: now() });
}

export async function updateRecord(
  species: string,
  changes: { holder: string; year: number | null; lengthInches: number },
) {
  await db.records.update(species, changes);
  await remoteWrite({
    table: "records",
    op: "update",
    key: species,
    payload: { holder: changes.holder, year: changes.year, length_inches: changes.lengthInches },
    at: now(),
  });
}

export async function broadcast(message: string) {
  const id = uuid();
  await db.notifications.add({ id, message, at: now(), read: false });
  // In cloud mode every device (incl. this one on echo) fires the OS push from
  // the realtime handler; local-only mode has no realtime, so notify here.
  if (!cloudEnabled) osNotify(message);
  await remoteWrite({ table: "notifications", op: "upsert", key: id, payload: { id, message }, at: now() });
}

export async function postGlory(entry: {
  userId: string;
  photo: Blob;
  description: string;
}): Promise<void> {
  const g: GloryPic = {
    id: uuid(),
    userId: entry.userId,
    photo: entry.photo,
    description: entry.description,
    catchDate: now(),
    comments: [],
    createdAt: now(),
  };
  await db.gloryPics.put(g);
  await remoteWrite({
    table: "glory_pics",
    op: "upsert",
    key: g.id,
    payload: {
      id: g.id,
      user_id: g.userId,
      description: g.description,
      catch_date: new Date(g.catchDate).toISOString(),
      comments: g.comments,
    },
    photo: entry.photo,
    photoBucket: "glory-pics",
    photoField: "photo_url",
    at: g.createdAt,
  });
}

export async function addComment(picId: string, comment: GloryComment) {
  const pic = await db.gloryPics.get(picId);
  if (!pic) return;
  const comments = [...pic.comments, comment];
  await db.gloryPics.update(picId, { comments });
  await remoteWrite({ table: "glory_pics", op: "update", key: picId, payload: { comments }, at: now() });
}

export async function setRole(userId: string, roleTag: RoleTag) {
  if (roleTag === "CHAMP") {
    const champs = await db.users.where("roleTag").equals("CHAMP").toArray();
    for (const c of champs) {
      await db.users.update(c.id, { roleTag: "ANGLER" });
      await remoteWrite({ table: "profiles", op: "update", key: c.id, payload: { role_tag: "ANGLER" }, at: now() });
    }
  }
  await db.users.update(userId, { roleTag });
  await remoteWrite({ table: "profiles", op: "update", key: userId, payload: { role_tag: roleTag }, at: now() });
}

export async function setNickname(userId: string, nickname: string) {
  const value = nickname.trim() || undefined;
  await db.users.update(userId, { nickname: value });
  await remoteWrite({
    table: "profiles",
    op: "update",
    key: userId,
    payload: { nickname: value ?? null },
    at: now(),
  });
}

const SETTINGS_MAP: Record<string, string> = {
  tournamentYear: "tournament_year",
  lureBonusPPI: "lure_bonus_ppi",
  trophyMinInches: "trophy_min_inches",
  trophyBonus: "trophy_bonus",
  recordBreakerBonus: "record_breaker_bonus",
  skateBaselinePPI: "skate_baseline_ppi",
  species: "species",
  offSeasonMode: "off_season_mode",
};

export async function updateSettings(changes: Partial<Settings>) {
  await db.settings.update(1, changes);
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(changes)) {
    if (k === "id") continue;
    const col = SETTINGS_MAP[k];
    if (col) payload[col] = v;
  }
  await remoteWrite({ table: "settings", op: "update", key: "1", payload, at: now() });
}
