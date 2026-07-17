import { type Table } from "dexie";
import { db, osNotify } from "./db";
import { cloudEnabled, supabase } from "./supabase";
import { hasPushSubscribed } from "./push";
import type {
  AppNotification,
  CatchEntry,
  GloryPic,
  Invite,
  Newsletter,
  OutboxItem,
  Penalty,
  RecordEntry,
  Settings,
  Tournament,
  User,
} from "../domain/types";

/**
 * Sync service: keeps the local Dexie mirror in step with Supabase.
 *  - pullAll():   initial snapshot of every table into Dexie
 *  - subscribe(): realtime postgres changes applied to Dexie (live board)
 *  - remoteWrite / flushOutbox: durable writes with an offline queue
 * The UI only ever reads from Dexie, so everything works offline; this module
 * is the one place that talks to the network.
 */

const KEY_FIELD: Record<OutboxItem["table"], string> = {
  catches: "id",
  glory_pics: "id",
  notifications: "id",
  profiles: "id",
  settings: "id",
  records: "species",
  newsletters: "id",
  tournaments: "id",
  invites: "id",
  penalties: "id",
};

// ---------- row mappers (snake_case ⇄ camelCase) ----------------------------
const ms = (t?: string | null) => (t ? new Date(t).getTime() : Date.now());

const toUser = (r: any): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  nickname: r.nickname ?? undefined,
  roleTag: r.role_tag,
  createdAt: ms(r.created_at),
});

const toCatch = (r: any): CatchEntry => ({
  id: r.id,
  userId: r.user_id,
  tournamentYear: r.tournament_year,
  species: r.species,
  speciesDetected: r.species_detected ?? undefined,
  lengthInches: Number(r.length_inches),
  gearType: r.gear_type,
  isSkate: r.is_skate,
  isTrophy: r.is_trophy,
  isRecordBreaker: r.is_record_breaker,
  pointValue: Number(r.point_value),
  photoUrl: r.photo_url ?? undefined,
  lat: r.lat ?? undefined,
  lng: r.lng ?? undefined,
  aiConfidence: r.ai_confidence ?? undefined,
  aiNotes: r.ai_notes ?? undefined,
  status: r.status,
  verifiedBy: r.verified_by ?? undefined,
  createdAt: ms(r.created_at),
});

const toGlory = (r: any): GloryPic => ({
  id: r.id,
  userId: r.user_id,
  photoUrl: r.photo_url ?? undefined,
  description: r.description ?? "",
  catchDate: ms(r.catch_date),
  comments: Array.isArray(r.comments) ? r.comments : [],
  nominatedYear: r.nominated_year ?? undefined,
  votes: Array.isArray(r.votes) ? r.votes : [],
  createdAt: ms(r.created_at),
});

const toRecord = (r: any): RecordEntry => ({
  species: r.species,
  holder: r.holder,
  year: r.year ?? null,
  lengthInches: Number(r.length_inches),
});

const toSettings = (r: any): Settings => ({
  id: 1,
  tournamentYear: r.tournament_year,
  species: r.species,
  offSeasonMode: r.off_season_mode,
  state: r.tournament_state ?? "SETUP",
  publishedAt: r.published_at ? ms(r.published_at) : undefined,
  reviewedAnglers: Array.isArray(r.reviewed_anglers) ? r.reviewed_anglers : [],
  gloryFavState: r.glory_fav_state ?? "OFF",
  rosterOverrides: r.roster_overrides && typeof r.roster_overrides === "object" ? r.roster_overrides : {},
  gloryFavLockedVoters: Array.isArray(r.glory_fav_locked_voters) ? r.glory_fav_locked_voters : [],
});

const toNewsletter = (r: any): Newsletter => ({
  id: r.id,
  title: r.title,
  body: r.body,
  author: r.author,
  createdAt: ms(r.created_at),
  protected: !!r.protected,
});

const toTournament = (r: any): Tournament => ({
  id: r.id,
  name: r.name,
  year: r.year,
  participantIds: Array.isArray(r.participant_ids) ? r.participant_ids : [],
  createdAt: ms(r.created_at),
  publishedAt: r.published_at ? ms(r.published_at) : undefined,
});

const toInvite = (r: any): Invite => ({
  id: r.id,
  email: r.email,
  name: r.name ?? undefined,
  roleTag: r.role_tag,
  createdAt: ms(r.created_at),
});

const toPenalty = (r: any): Penalty => ({
  id: r.id,
  userId: r.user_id,
  tournamentYear: r.tournament_year,
  description: r.description ?? "",
  points: Number(r.points),
  createdAt: ms(r.created_at),
});

async function toNotification(r: any): Promise<AppNotification> {
  const existing = await db.notifications.get(r.id);
  return { id: r.id, message: r.message, at: ms(r.created_at), read: existing?.read ?? false };
}

// ---------- initial pull ----------------------------------------------------
export async function pullAll() {
  if (!supabase) return;
  const [profiles, settings, records, catches, glory, notifs, newsletters, tournaments, invites, penalties] =
    await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("records").select("*"),
      supabase.from("catches").select("*"),
      supabase.from("glory_pics").select("*"),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("newsletters").select("*").order("created_at", { ascending: false }),
      // New tables — guarded so a project that hasn't run the migration still syncs the rest.
      supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
      supabase.from("invites").select("*").order("created_at", { ascending: false }),
      supabase.from("penalties").select("*"),
    ]);

  if (profiles.data) await db.users.bulkPut(profiles.data.map(toUser));
  if (settings.data) await db.settings.put(toSettings(settings.data));
  if (records.data) await db.records.bulkPut(records.data.map(toRecord));
  if (catches.data) await db.catches.bulkPut(catches.data.map(toCatch));
  if (glory.data) await db.gloryPics.bulkPut(glory.data.map(toGlory));
  if (newsletters.data) await db.newsletters.bulkPut(newsletters.data.map(toNewsletter));
  if (tournaments.data) await db.tournaments.bulkPut(tournaments.data.map(toTournament));
  if (invites.data) await db.invites.bulkPut(invites.data.map(toInvite));
  if (penalties.data) await db.penalties.bulkPut(penalties.data.map(toPenalty));
  if (notifs.data) {
    for (const n of notifs.data) await db.notifications.put(await toNotification(n));
  }

  // Reconcile deletions: a cold pull otherwise only adds/updates, so rows
  // deleted in the cloud would linger locally on a device that was offline when
  // the delete happened. Remove local rows absent from the cloud — but keep any
  // still pending upload in the outbox so offline-first writes aren't lost. Only
  // reconcile tables whose fetch succeeded (data is null on error, [] when empty).
  const pendingKeys = new Set((await db.outbox.toArray()).map((o) => o.key));
  const reap = async (table: Table<unknown, string>, cloudRows: { id: string }[] | null) => {
    if (!cloudRows) return;
    const cloudIds = new Set(cloudRows.map((r) => r.id));
    const localKeys = (await table.toCollection().primaryKeys()) as string[];
    const toDelete = localKeys.filter((k) => !cloudIds.has(k) && !pendingKeys.has(k));
    if (toDelete.length) await table.bulkDelete(toDelete);
  };
  await reap(db.catches, catches.data as { id: string }[] | null);
  await reap(db.tournaments, tournaments.data as { id: string }[] | null);
  await reap(db.penalties, penalties.data as { id: string }[] | null);
  await reap(db.gloryPics, glory.data as { id: string }[] | null);
  await reap(db.newsletters, newsletters.data as { id: string }[] | null);
  await reap(db.invites, invites.data as { id: string }[] | null);
  await reap(db.users, profiles.data as { id: string }[] | null);
  await reap(db.records, records.data ? records.data.map((r: any) => ({ id: r.species })) : null);
}

// ---------- realtime --------------------------------------------------------
let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

export function subscribe() {
  if (!supabase || channel) return;
  channel = supabase.channel("src-live");

  const on = (table: string, apply: (row: any) => Promise<unknown>, remove: (row: any) => Promise<unknown>) =>
    channel!.on("postgres_changes", { event: "*", schema: "public", table }, async (p) => {
      if (p.eventType === "DELETE") await remove(p.old);
      else await apply(p.new);
    });

  on("profiles", async (r) => db.users.put(toUser(r)), async (r) => db.users.delete(r.id));
  on("catches", async (r) => db.catches.put(toCatch(r)), async (r) => db.catches.delete(r.id));
  on("glory_pics", async (r) => db.gloryPics.put(toGlory(r)), async (r) => db.gloryPics.delete(r.id));
  on("records", async (r) => db.records.put(toRecord(r)), async (r) => db.records.delete(r.species));
  on("newsletters", async (r) => db.newsletters.put(toNewsletter(r)), async (r) => db.newsletters.delete(r.id));
  on("tournaments", async (r) => db.tournaments.put(toTournament(r)), async (r) => db.tournaments.delete(r.id));
  on("invites", async (r) => db.invites.put(toInvite(r)), async (r) => db.invites.delete(r.id));
  on("penalties", async (r) => db.penalties.put(toPenalty(r)), async (r) => db.penalties.delete(r.id));
  on("settings", async (r) => db.settings.put(toSettings(r)), async () => {});
  on(
    "notifications",
    async (r) => {
      const isNew = !(await db.notifications.get(r.id));
      await db.notifications.put(await toNotification(r));
      // Push already covers foreground + background on devices that have it —
      // showing both double-fires the same notification (see the M.O.C. report).
      if (isNew && !hasPushSubscribed()) osNotify(r.message);
    },
    async (r) => db.notifications.delete(r.id),
  );

  channel.subscribe();
}

export function unsubscribe() {
  if (supabase && channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}

// ---------- durable writes with offline outbox ------------------------------
async function uploadPhoto(bucket: "catch-photos" | "glory-pics", key: string, blob: Blob): Promise<string> {
  const path = `${key}.jpg`;
  const { error } = await supabase!.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
  if (error) throw error;
  return supabase!.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function pushItem(item: OutboxItem) {
  let payload = item.payload;
  if (item.photo && item.photoBucket && item.photoField) {
    const url = await uploadPhoto(item.photoBucket, item.key, item.photo);
    payload = { ...payload, [item.photoField]: url };
    // reflect the uploaded URL (and drop the local blob) in the mirror
    if (item.table === "catches") await db.catches.update(item.key, { photoUrl: url, photo: undefined });
    if (item.table === "glory_pics") await db.gloryPics.update(item.key, { photoUrl: url, photo: undefined });
  }
  const keyField = KEY_FIELD[item.table];
  const q = supabase!.from(item.table);
  const { error } =
    item.op === "upsert"
      ? await q.upsert(payload)
      : item.op === "update"
        ? await q.update(payload).eq(keyField, item.key)
        : await q.delete().eq(keyField, item.key);
  if (error) throw error;
}

/**
 * Push a write now; if offline or it fails, queue it for later replay.
 *
 * `queueOnFail: false` makes the write best-effort — used for the optional
 * tournaments/invites tables so that, if the additive migration hasn't been run
 * yet, a failing write is dropped rather than jamming the shared outbox (whose
 * flush stops on the first error) and blocking catch/settings sync.
 */
export async function remoteWrite(item: OutboxItem, opts: { queueOnFail?: boolean } = {}) {
  if (!cloudEnabled || !supabase) return; // local-only mode: Dexie is the truth
  const queueOnFail = opts.queueOnFail ?? true;
  if (!navigator.onLine) {
    if (queueOnFail) await db.outbox.add(item);
    return;
  }
  try {
    await pushItem(item);
  } catch {
    if (queueOnFail) await db.outbox.add(item);
  }
}

let flushing = false;
export async function flushOutbox() {
  if (!supabase || flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const items = await db.outbox.orderBy("at").toArray();
    for (const item of items) {
      try {
        await pushItem(item);
        await db.outbox.delete(item.id!);
      } catch {
        break; // still offline / transient — leave the rest queued
      }
    }
  } finally {
    flushing = false;
  }
}

// ---------- lifecycle -------------------------------------------------------
export async function startSync() {
  if (!cloudEnabled) return;
  await pullAll();
  subscribe();
  await flushOutbox();
  window.addEventListener("online", flushOutbox);
}

export function stopSync() {
  unsubscribe();
  window.removeEventListener("online", flushOutbox);
}
