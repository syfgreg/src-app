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
    .replace(/\.(jpg|jpeg|png|gif)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const files1999 = ["DEREK_KEN.jpg", "FISHINDEREK.jpg", "Kev.jpg", "THE_DUBB.jpg", "cvlot.jpg", "friscia.jpg", "jerryegan.jpg", "spear.jpg"];
const files2000 = ["BIG_FISH_TREE.jpg", "ERIC_AND_BANNER.jpg", "ERIC_AND_NIGHT_SCENE.jpg", "ERIC_WITH_POTATOS.jpg", "EVERYONE_AROUD_FIRE_NIGHT2.jpg", "HUXTABLE_RELAXIN.jpg", "MC_1.jpg", "MC_2.jpg", "MC_3.jpg", "NEGATIVE_TYE_DIE.jpg", "NEGATIVE_VIEW_FIRE.jpg", "NIGHT_FIRE.jpg", "NIGHT_SCENE_GROLSCH.jpg", "NIGHT_SCENE_OF_SITE.jpg", "SAT_EVE_FIRE_SCENE.jpg"];
const files2001 = ["DCP00527.JPG", "DCP00528.JPG", "DCP00529.JPG", "DCP00530.JPG", "DCP00531.JPG", "DCP00532.JPG", "DCP00533.JPG", "DCP00534.JPG", "PIC00001.jpg", "PIC00002.jpg", "PIC00006.jpg", "PIC00007.jpg", "PIC00009.jpg", "Sea_Robin_Photo.jpg", "erikopening.jpg", "firesidefriday.jpg", "firesidefriday2.jpg", "johntourney.jpg"];
const files2015 = ["Campsite_Sunrise.jpg", "Sunset_Chat.jpg", "Morning_Sky.jpg", "Ponies_By_The_Trailer.jpg", "Ponies_In_The_Parking_Lot.jpg", "Bundled_Up_At_Camp.jpg", "Fireside_Friends.jpg", "Pony_On_The_Beach.jpg", "Pony_By_The_Tower.jpg"];
const files2016 = ["Loading_The_Truck.jpg", "Gear_Cart_On_The_Road.jpg", "Campfire_Night.jpg", "Fireside_Glow.jpg", "Tending_The_Fire.jpg", "Beach_Campsite.jpg", "Rod_Cart_On_The_Beach.jpg", "Ponies_By_The_Picnic_Table.jpg", "Ponies_On_The_Beach.jpg", "Dusk_At_Camp.jpg", "Sunset_Over_Camp.jpg"];
const files2017 = ["Crossing_The_Bridge.jpg", "Pony_Grazing.jpg", "Pony_Foal.jpg", "Ponies_At_Camp.jpg", "Ponies_Crowding_Camp.jpg", "Diner_Breakfast.jpg", "Staking_Out_The_Spot.jpg", "SRC_Camp_Setup.jpg", "Camp_Selfie.jpg", "Championship_Trophy.jpg", "Prepping_Gear.jpg", "SRC_Flag_At_Dusk.jpg", "Evening_Gathering.jpg", "Camp_At_Dusk.jpg", "Glory_Shot_Board.jpg", "Sunset_Silhouette.jpg", "Lure_Close_Up.jpg", "Fish_Skeleton_Art.jpg"];
const files2019 = ["Flag_At_Dusk.jpg", "Fiery_Sunset.jpg", "Championship_Trophy.jpg", "Empty_Beach.jpg", "Waving_Flag.gif"];
const files2021 = ["Sunset_At_Camp.jpg", "Tents_At_Dusk.jpg", "Fiery_Skyline.jpg", "Sunset_Over_The_Shed.jpg", "Sunset_On_The_Dune_Road.jpg", "Camp_At_Sunset.jpg", "Pony_Grazing.jpg", "Pony_In_The_Frost.jpg"];
const files2023 = ["Crossing_The_Bridge.jpg", "Ponies_By_The_Road.jpg", "Pony_Grazing.jpg", "Pony_By_The_Roadside.jpg", "Pony_On_The_Shoulder.jpg", "Orange_Tents.jpg", "Clouds_Over_The_Beach.jpg", "Tent_At_Sunset.jpg", "Flags_At_Camp.jpg", "Glowing_Tent.jpg", "Night_At_Camp.jpg", "Campfire_Flames.jpg", "Skate_On_The_Sand.jpg", "Sunset_On_The_Road.jpg", "Pink_Sky_Sunset.jpg", "Evening_Camp.jpg", "Dusk_At_Camp.jpg", "Grilling_Steaks.jpg", "Late_Night_Camp.jpg"];
const files2024 = ["Rods_At_Sunset.jpg", "Sunset_Fishing_Spot.jpg", "Evening_On_The_Beach.jpg", "Trophy_Winner.jpg", "Campfire_Glow.jpg", "Ocean_Sunrise.jpg", "Pony_In_The_Road.jpg", "Night_Selfie.jpg", "Seagull_On_The_Beach.jpg", "Sunset_Waves.jpg", "Fireside_Chat.jpg", "Telling_Tales.jpg", "Campfire_Story.jpg", "Fireside_Circle.jpg", "Night_Around_The_Fire.jpg", "Cornhole_At_Camp.jpg", "Camp_Buddies.jpg", "Road_Trip_Selfie.jpg"];
const files2025 = ["Prepping_Chili.jpg", "Firewood_And_Camp.jpg", "Sunset_Silhouette.jpg", "Tent_At_Night.jpg", "Fiery_Sunset.jpg", "Night_By_The_Fire.jpg", "Moon_Through_Clouds.jpg", "Moonlit_Beach.jpg", "Dusk_At_Camp.jpg", "Sunset_Over_The_Fence.jpg", "Camp_Lights_At_Dusk.jpg", "Moonrise_Over_The_Ocean.jpg", "Pony_On_The_Dune.jpg", "Flag_On_The_Dune.jpg", "Camp_At_Dusk_2.jpg", "Camp_Selfie.jpg", "Moonlit_Dunes.jpg", "Rod_Cart_Portrait.jpg", "Walking_The_Beach.jpg", "Tents_At_Sunrise.jpg", "Sunset_Selfie.jpg", "Walking_Into_The_Surf.jpg", "Pirate_Flag_Sunset.jpg", "Grilling_Steaks.jpg", "Flag_Under_The_Stars.jpg", "Relaxing_At_Camp.jpg", "Camp_Chairs.jpg", "Tying_Tackle.jpg", "Rigging_Up.jpg", "Coffee_On_The_Beach.jpg", "Silhouettes_At_Sunset.jpg", "Fireside_Speech.jpg", "Campfire_Gathering.jpg", "Campfire_Toast.jpg", "Presenting_The_Trophy.jpg"];

export const MEMORIES: MemoryItem[] = [
  ...files1999.map((f) => ({ year: 1999, src: `/memories/1999/${f}`, caption: cap(f) })),
  ...files2000.map((f) => ({ year: 2000, src: `/memories/2000/${f}`, caption: cap(f) })),
  ...files2001.map((f) => ({ year: 2001, src: `/memories/2001/${f}`, caption: cap(f) })),
  ...files2015.map((f) => ({ year: 2015, src: `/memories/2015/${f}`, caption: cap(f) })),
  ...files2016.map((f) => ({ year: 2016, src: `/memories/2016/${f}`, caption: cap(f) })),
  ...files2017.map((f) => ({ year: 2017, src: `/memories/2017/${f}`, caption: cap(f) })),
  ...files2019.map((f) => ({ year: 2019, src: `/memories/2019/${f}`, caption: cap(f) })),
  ...files2021.map((f) => ({ year: 2021, src: `/memories/2021/${f}`, caption: cap(f) })),
  ...files2023.map((f) => ({ year: 2023, src: `/memories/2023/${f}`, caption: cap(f) })),
  ...files2024.map((f) => ({ year: 2024, src: `/memories/2024/${f}`, caption: cap(f) })),
  ...files2025.map((f) => ({ year: 2025, src: `/memories/2025/${f}`, caption: cap(f) })),
];

export const MEMORY_YEARS = [1999, 2000, 2001, 2015, 2016, 2017, 2019, 2021, 2023, 2024, 2025];

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
