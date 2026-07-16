import { db, osNotify } from "./db";
import { cloudEnabled, supabase } from "./supabase";
import { remoteWrite } from "./sync";
import { triggerBackup } from "./backup";
import { triggerPush } from "./push";
import type {
  CatchEntry,
  GloryComment,
  GloryPic,
  Invite,
  Newsletter,
  Penalty,
  RoleTag,
  Settings,
  Tournament,
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
  triggerPush(message); // wakes devices even if fully closed (Web Push)
}

export async function postGlory(entry: {
  userId: string;
  photo: Blob;
  description: string;
  /** Set to immediately enter this shot in the tournament's Glory Shot Fav vote. */
  nominatedYear?: number;
}): Promise<void> {
  const g: GloryPic = {
    id: uuid(),
    userId: entry.userId,
    photo: entry.photo,
    description: entry.description,
    catchDate: now(),
    comments: [],
    nominatedYear: entry.nominatedYear,
    votes: [],
    createdAt: now(),
  };
  await db.gloryPics.put(g);
  // Only send nominated_year when it's set, so a normal post still succeeds on a
  // backend that hasn't run the glory-fav migration yet (votes defaults to '[]').
  const payload: Record<string, unknown> = {
    id: g.id,
    user_id: g.userId,
    description: g.description,
    catch_date: new Date(g.catchDate).toISOString(),
    comments: g.comments,
  };
  if (entry.nominatedYear != null) payload.nominated_year = entry.nominatedYear;
  await remoteWrite({
    table: "glory_pics",
    op: "upsert",
    key: g.id,
    payload,
    photo: entry.photo,
    photoBucket: "glory-pics",
    photoField: "photo_url",
    at: g.createdAt,
  });
}

/** M.O.C.: enter an existing glory shot into the tournament's Glory Shot Fav vote. */
export async function nominateGlory(picId: string, year: number) {
  await db.gloryPics.update(picId, { nominatedYear: year });
  await remoteWrite(
    { table: "glory_pics", op: "update", key: picId, payload: { nominated_year: year }, at: now() },
    { queueOnFail: false },
  );
}

/** M.O.C.: remove a shot from the fav vote (also clears its votes). */
export async function unnominateGlory(picId: string) {
  await db.gloryPics.update(picId, { nominatedYear: undefined, votes: [] });
  await remoteWrite(
    { table: "glory_pics", op: "update", key: picId, payload: { nominated_year: null, votes: [] }, at: now() },
    { queueOnFail: false },
  );
}

/**
 * Cast (or toggle off) a participant's Glory Shot Fav vote. One vote per
 * participant per tournament, so voting for a shot removes the participant's
 * vote from every other nominee that year.
 */
export async function voteGloryFav(userId: string, picId: string, year: number) {
  // Voting is only accepted while the M.O.C. has the vote OPEN.
  const settings = await db.settings.get(1);
  if ((settings?.gloryFavState ?? "OFF") !== "OPEN") return;
  const nominees = (await db.gloryPics.toArray()).filter((g) => g.nominatedYear === year);
  for (const g of nominees) {
    const prev = g.votes ?? [];
    const hadVote = prev.includes(userId);
    const wantVote = g.id === picId ? !hadVote : false;
    if (hadVote === wantVote) continue; // no change for this shot
    const next = wantVote ? [...prev, userId] : prev.filter((v) => v !== userId);
    await db.gloryPics.update(g.id, { votes: next });
    // Durable write: if it fails/offline it queues and retries, so a flaky
    // network can't drop half a vote-switch and leave the old pick stuck.
    await remoteWrite({ table: "glory_pics", op: "update", key: g.id, payload: { votes: next }, at: now() });
  }
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
  species: "species",
  offSeasonMode: "off_season_mode",
  state: "tournament_state",
  publishedAt: "published_at",
  reviewedAnglers: "reviewed_anglers",
  gloryFavState: "glory_fav_state",
  rosterOverrides: "roster_overrides",
};

/** Set the roster status (role) of a non-login member (historic angler by name key). */
export async function setRosterOverride(key: string, roleTag: RoleTag) {
  const settings = await db.settings.get(1);
  const next = { ...(settings?.rosterOverrides ?? {}), [key]: roleTag };
  await updateSettings({ rosterOverrides: next });
}

export async function updateSettings(changes: Partial<Settings>) {
  await db.settings.update(1, changes);
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(changes)) {
    if (k === "id") continue;
    const col = SETTINGS_MAP[k];
    if (!col) continue;
    // published_at is a timestamptz column; send ISO (or null), not ms epoch.
    payload[col] = col === "published_at" && typeof v === "number" ? new Date(v).toISOString() : v;
  }
  await remoteWrite({ table: "settings", op: "update", key: "1", payload, at: now() });
}

// ---------- tournament lifecycle -------------------------------------------
export async function startTournament() {
  await updateSettings({ state: "LIVE" });
  await broadcast("🎣 The tournament is LIVE — lines in the water!");
}

export async function endTournament() {
  const settings = await db.settings.get(1);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const balloted = await db.gloryPics.filter((g) => g.nominatedYear === year).count();
  // Ending opens the Glory Shot Fav vote only if the M.O.C. already curated a
  // ballot; otherwise voting waits for the M.O.C.'s "Publish for Voting" button.
  if (balloted > 0) {
    await updateSettings({ state: "ENDED", gloryFavState: "OPEN" });
    await broadcast("🏁 Our Tournament has Ended! Go Vote for your Glory Shot Fav!");
  } else {
    await updateSettings({ state: "ENDED" });
    await broadcast("Lines out! The tournament has ended — the M.O.C. is validating scorecards.");
  }
  triggerBackup(); // milestone snapshot
}

// ---------- Glory Shot Fav vote lifecycle (M.O.C., manual) -------------------
/** Publish the curated ballot: opens voting and calls the field to the polls. */
export async function openGloryVoting() {
  await updateSettings({ gloryFavState: "OPEN" });
  await broadcast("📸 Voting is OPEN — go pick your Glory Shot Fav!");
}

/** Close the vote so no more ballots are accepted (winner not yet revealed). */
export async function closeGloryVote() {
  await updateSettings({ gloryFavState: "CLOSED" });
}

/** Reveal the Glory Shot Fav winner to everyone (M.O.C. announces verbally first). */
export async function publishGloryFav() {
  await updateSettings({ gloryFavState: "PUBLISHED" });
  await broadcast("🏆 The Glory Shot Fav results are in — see who won!");
  triggerBackup(); // milestone snapshot
}

/** Re-open voting (e.g. after an accidental close), back to accepting ballots. */
export async function reopenGloryVote() {
  await updateSettings({ gloryFavState: "OPEN" });
}

export interface BackupFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

/** List the M.O.C.'s backup files with time-limited direct-download links. */
export async function listBackups(): Promise<BackupFile[]> {
  if (!cloudEnabled || !supabase) return [];
  const { data, error } = await supabase.storage
    .from("backups")
    .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return [];
  const withUrls = await Promise.all(
    data
      .filter((f) => f.id) // skip folder placeholder entries
      .map(async (f) => {
        const { data: signed } = await supabase!.storage.from("backups").createSignedUrl(f.name, 3600);
        return {
          name: f.name,
          url: signed?.signedUrl ?? "",
          size: (f.metadata?.size as number) ?? 0,
          createdAt: f.created_at ?? "",
        };
      }),
  );
  return withUrls.filter((f) => f.url);
}

/** Clear every Glory Shot Fav vote for a year — unlocks all voters to vote again. */
export async function resetGloryVotes(year: number) {
  const nominees = (await db.gloryPics.toArray()).filter(
    (g) => g.nominatedYear === year && (g.votes?.length ?? 0) > 0,
  );
  for (const g of nominees) {
    await db.gloryPics.update(g.id, { votes: [] });
    await remoteWrite({ table: "glory_pics", op: "update", key: g.id, payload: { votes: [] }, at: now() });
  }
}

/** Mark which anglers' scorecards the M.O.C. has validated (gates Publish). */
export async function setReviewedAnglers(ids: string[]) {
  await updateSettings({ reviewedAnglers: ids });
}

/**
 * Publish: finalize the record book from approved record-breakers (highest
 * length per species that still beats the standing record), flip to PUBLISHED,
 * and announce. Records are only rewritten here — never mid-tournament — so the
 * book can't churn while fish are still coming in.
 */
export async function publishResults() {
  const settings = await db.settings.get(1);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const approved = await db.catches
    .where("tournamentYear")
    .equals(year)
    .and((c) => c.status === "APPROVED" && c.isRecordBreaker)
    .toArray();

  const bestBySpecies = new Map<string, CatchEntry>();
  for (const c of approved) {
    const key = c.species.toLowerCase();
    const cur = bestBySpecies.get(key);
    if (!cur || c.lengthInches > cur.lengthInches) bestBySpecies.set(key, c);
  }

  const records = await db.records.toArray();
  for (const c of bestBySpecies.values()) {
    const rec = records.find((r) => r.species.toLowerCase() === c.species.toLowerCase());
    if (!rec || c.lengthInches <= rec.lengthInches) continue;
    const angler = await db.users.get(c.userId);
    await updateRecord(rec.species, {
      holder: angler?.name ?? "An angler",
      year: c.tournamentYear,
      lengthInches: c.lengthInches,
    });
  }

  const publishedAt = now();
  await updateSettings({ state: "PUBLISHED", publishedAt });
  // Stamp the active tournament in the registry so history records when it closed.
  const active = (await db.tournaments.toArray()).find((t) => t.year === year);
  if (active) await upsertTournament({ ...active, publishedAt });
  await broadcast("🏆 The results are official! Tap in to see the final standings.");
  triggerBackup(); // milestone snapshot — final, official standings
}

// ---------- newsletter ------------------------------------------------------
export async function publishNewsletter(entry: { title: string; body: string; author: string }): Promise<void> {
  const n: Newsletter = { id: uuid(), createdAt: now(), ...entry };
  await db.newsletters.put(n);
  await remoteWrite({
    table: "newsletters",
    op: "upsert",
    key: n.id,
    payload: {
      id: n.id,
      title: n.title,
      body: n.body,
      author: n.author,
      created_at: new Date(n.createdAt).toISOString(),
    },
    at: n.createdAt,
  });
}

export async function deleteNewsletter(id: string) {
  const n = await db.newsletters.get(id);
  if (n?.protected) return; // RLS blocks this remotely too — don't even optimistically remove it locally
  await db.newsletters.delete(id);
  await remoteWrite({ table: "newsletters", op: "delete", key: id, payload: {}, at: now() });
}

// ---------- roster invites --------------------------------------------------
/**
 * Pre-register an angler: the M.O.C. records their email + role, and when the
 * person signs up with that email they inherit the role (cloud: via the
 * handle_new_user trigger; local: applied in AppContext.register).
 */
export async function createInvite(entry: { email: string; name?: string; roleTag: RoleTag }): Promise<Invite> {
  const invite: Invite = {
    id: uuid(),
    email: entry.email.trim().toLowerCase(),
    name: entry.name?.trim() || undefined,
    roleTag: entry.roleTag,
    createdAt: now(),
  };
  await db.invites.put(invite);
  await remoteWrite(
    {
      table: "invites",
      op: "upsert",
      key: invite.id,
      payload: {
        id: invite.id,
        email: invite.email,
        name: invite.name ?? null,
        role_tag: invite.roleTag,
        created_at: new Date(invite.createdAt).toISOString(),
      },
      at: invite.createdAt,
    },
    { queueOnFail: false },
  );
  return invite;
}

export async function deleteInvite(id: string) {
  await db.invites.delete(id);
  await remoteWrite({ table: "invites", op: "delete", key: id, payload: {}, at: now() }, { queueOnFail: false });
}

// ---------- M.O.C. scoring penalties ----------------------------------------
export async function createPenalty(entry: {
  userId: string;
  tournamentYear: number;
  description: string;
  points: number;
}): Promise<Penalty> {
  const penalty: Penalty = {
    id: uuid(),
    userId: entry.userId,
    tournamentYear: entry.tournamentYear,
    description: entry.description.trim(),
    points: Math.abs(entry.points),
    createdAt: now(),
  };
  await db.penalties.put(penalty);
  await remoteWrite(
    {
      table: "penalties",
      op: "upsert",
      key: penalty.id,
      payload: {
        id: penalty.id,
        user_id: penalty.userId,
        tournament_year: penalty.tournamentYear,
        description: penalty.description,
        points: penalty.points,
        created_at: new Date(penalty.createdAt).toISOString(),
      },
      at: penalty.createdAt,
    },
    { queueOnFail: false },
  );
  return penalty;
}

export async function deletePenalty(id: string) {
  await db.penalties.delete(id);
  await remoteWrite({ table: "penalties", op: "delete", key: id, payload: {}, at: now() }, { queueOnFail: false });
}

// ---------- tournament registry / history -----------------------------------
export async function upsertTournament(t: Tournament) {
  await db.tournaments.put(t);
  await remoteWrite(
    {
      table: "tournaments",
      op: "upsert",
      key: t.id,
      payload: {
        id: t.id,
        name: t.name,
        year: t.year,
        participant_ids: t.participantIds,
        created_at: new Date(t.createdAt).toISOString(),
        published_at: t.publishedAt ? new Date(t.publishedAt).toISOString() : null,
      },
      at: t.createdAt,
    },
    { queueOnFail: false },
  );
}

export async function renameTournament(id: string, name: string) {
  await db.tournaments.update(id, { name });
  await remoteWrite({ table: "tournaments", op: "update", key: id, payload: { name }, at: now() }, { queueOnFail: false });
}

export async function deleteTournament(id: string) {
  await db.tournaments.delete(id);
  await remoteWrite({ table: "tournaments", op: "delete", key: id, payload: {}, at: now() }, { queueOnFail: false });
}

/**
 * Save the current tournament to history and start a fresh one. Because every
 * catch is scoped by tournament year, switching to a new year gives a clean
 * board while the previous tournament's catches remain queryable. The outgoing
 * tournament is auto-recorded (if it wasn't already) so nothing is lost.
 */
export async function startNewTournament(opts: {
  name: string;
  year: number;
  participantIds: string[];
}): Promise<void> {
  const settings = await db.settings.get(1);
  const currentYear = settings?.tournamentYear ?? new Date().getFullYear();

  // Guard the core invariant: a new tournament's board must be empty. If any
  // catch already exists for the chosen year, refuse — the year is the scoping
  // key, so reusing it would inherit those catches.
  const clash = await db.catches.where("tournamentYear").equals(opts.year).count();
  if (clash > 0) {
    throw new Error(
      `Year ${opts.year} already has ${clash} catch${clash === 1 ? "" : "es"}. Pick an unused year so the new tournament starts clean.`,
    );
  }

  // Archive the outgoing tournament if it isn't in the registry yet.
  const existing = (await db.tournaments.toArray()).find((t) => t.year === currentYear);
  if (!existing) {
    await upsertTournament({
      id: uuid(),
      name: `Sea Robin Classic ${currentYear}`,
      year: currentYear,
      participantIds: [],
      createdAt: now(),
      publishedAt: settings?.state === "PUBLISHED" ? settings.publishedAt ?? now() : undefined,
    });
  }

  // Register the new tournament and make it active (SETUP until the M.O.C. starts it).
  await upsertTournament({
    id: uuid(),
    name: opts.name.trim() || `Sea Robin Classic ${opts.year}`,
    year: opts.year,
    participantIds: opts.participantIds,
    createdAt: now(),
  });
  await updateSettings({ tournamentYear: opts.year, state: "SETUP", reviewedAnglers: [], gloryFavState: "OFF" });
  await broadcast(`A new tournament is on the board: ${opts.name.trim() || `Sea Robin Classic ${opts.year}`}.`);
}
