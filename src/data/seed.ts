import { db, hashPassword } from "./db";
import { cloudEnabled } from "./supabase";
import { DEFAULT_SETTINGS } from "../domain/scoring";
import { OFFICIAL_RECORDS } from "../domain/records";

export interface MemoryItem {
  year: number;
  src: string;
  caption: string;
}

const cap = (f: string) =>
  f
    .replace(/\.(jpg|jpeg|png)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const files1999 = ["DEREK_KEN.jpg", "FISHINDEREK.jpg", "Kev.jpg", "THE_DUBB.jpg", "cvlot.jpg", "friscia.jpg", "jerryegan.jpg", "spear.jpg"];
const files2000 = ["BIG_FISH_TREE.jpg", "ERIC_AND_BANNER.jpg", "ERIC_AND_NIGHT_SCENE.jpg", "ERIC_WITH_POTATOS.jpg", "EVERYONE_AROUD_FIRE_NIGHT2.jpg", "HUXTABLE_RELAXIN.jpg", "MC_1.jpg", "MC_2.jpg", "MC_3.jpg", "NEGATIVE_TYE_DIE.jpg", "NEGATIVE_VIEW_FIRE.jpg", "NIGHT_FIRE.jpg", "NIGHT_SCENE_GROLSCH.jpg", "NIGHT_SCENE_OF_SITE.jpg", "SAT_EVE_FIRE_SCENE.jpg"];
const files2001 = ["DCP00527.JPG", "DCP00528.JPG", "DCP00529.JPG", "DCP00530.JPG", "DCP00531.JPG", "DCP00532.JPG", "DCP00533.JPG", "DCP00534.JPG", "PIC00001.jpg", "PIC00002.jpg", "PIC00006.jpg", "PIC00007.jpg", "PIC00009.jpg", "Sea_Robin_Photo.jpg", "erikopening.jpg", "firesidefriday.jpg", "firesidefriday2.jpg", "johntourney.jpg"];

export const MEMORIES: MemoryItem[] = [
  ...files1999.map((f) => ({ year: 1999, src: `/memories/1999/${f}`, caption: cap(f) })),
  ...files2000.map((f) => ({ year: 2000, src: `/memories/2000/${f}`, caption: cap(f) })),
  ...files2001.map((f) => ({ year: 2001, src: `/memories/2001/${f}`, caption: cap(f) })),
];

export const MEMORY_YEARS = [1999, 2000, 2001];

/**
 * Local-only first-run seed: settings, records, and a demo M.O.C. account.
 * In cloud mode the seed comes from supabase/schema.sql and the sync service
 * fills Dexie, so this is skipped.
 */
export async function seedIfNeeded() {
  if (cloudEnabled) return;

  if ((await db.settings.count()) === 0) {
    await db.settings.put({ id: 1, ...DEFAULT_SETTINGS });
  }
  if ((await db.records.count()) === 0) {
    await db.records.bulkPut(OFFICIAL_RECORDS.map((r) => ({ ...r })));
  }
  if ((await db.users.count()) === 0) {
    await db.users.add({
      id: crypto.randomUUID(),
      email: "moc@searobinclassic.com",
      name: "E.W. Keresty",
      nickname: "The M.O.C.",
      roleTag: "MOC",
      passwordHash: await hashPassword("searobin"),
      createdAt: Date.now(),
    });
  }
}
