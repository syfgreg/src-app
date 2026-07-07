/**
 * Weather, marine, and tide data for the tournament beach.
 *
 * Free, no-key public APIs (client-side, CORS-enabled):
 *  - Open-Meteo forecast  — 3-day forecast + current conditions + wind
 *  - Open-Meteo marine    — wave height/period, swell, sea-surface temp
 *  - NOAA Tides & Currents — high/low tide predictions for the local station
 *
 * Every source is fetched independently (Promise.allSettled), so one API being
 * down never blanks the whole report. The UI layer caches the last good report
 * for offline use.
 */
import type { IconName } from "../components/Icon";
import { TOURNAMENT_LOCATION as LOC } from "../domain/location";

export interface CurrentConditions {
  tempF: number | null;
  icon: IconName;
  condition: string;
}

export interface DayForecast {
  date: string;
  label: string;
  icon: IconName;
  condition: string;
  highF: number | null;
  lowF: number | null;
  precipProb: number | null;
  windMph: number | null;
}

export interface OceanConditions {
  waterTempF: number | null;
  waveHeightFt: number | null;
  wavePeriodS: number | null;
  swellHeightFt: number | null;
  windMph: number | null;
  windDir: string | null;
}

export interface TideEvent {
  time: number; // epoch ms (local station time)
  type: "HIGH" | "LOW";
  heightFt: number;
}

export interface MarineReport {
  fetchedAt: number;
  current: CurrentConditions | null;
  forecast: DayForecast[];
  ocean: OceanConditions | null;
  tides: TideEvent[];
}

/** WMO weather code → line icon + short label. */
export function describeWeather(code: number): { icon: IconName; condition: string } {
  if (code === 0) return { icon: "sun", condition: "Clear" };
  if (code === 1 || code === 2) return { icon: "cloud-sun", condition: code === 1 ? "Mostly clear" : "Partly cloudy" };
  if (code === 3) return { icon: "cloud", condition: "Overcast" };
  if (code === 45 || code === 48) return { icon: "cloud-fog", condition: "Fog" };
  if (code >= 51 && code <= 57) return { icon: "cloud-drizzle", condition: "Drizzle" };
  if (code >= 61 && code <= 67) return { icon: "cloud-rain", condition: "Rain" };
  if (code >= 71 && code <= 77) return { icon: "cloud-snow", condition: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "cloud-rain", condition: "Showers" };
  if (code === 85 || code === 86) return { icon: "cloud-snow", condition: "Snow showers" };
  if (code >= 95) return { icon: "cloud-lightning", condition: "Thunderstorms" };
  return { icon: "cloud", condition: "—" };
}

const cToF = (c: number): number => (c * 9) / 5 + 32;
const mToFt = (m: number): number => m * 3.28084;

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
function compass(deg: number | null | undefined): string | null {
  if (deg == null || Number.isNaN(deg)) return null;
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function dayLabel(dateStr: string, idx: number): string {
  if (idx === 0) return "Today";
  if (idx === 1) return "Tomorrow";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" });
}

/**
 * fetch + JSON with a hard timeout. Keeps a slow or unreachable source from
 * stalling the whole report — each source fails fast and independently so the
 * others still render.
 */
const FETCH_TIMEOUT_MS = 12_000;
async function fetchJson(url: string, label: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${label} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface ForecastResult {
  current: CurrentConditions;
  forecast: DayForecast[];
  windMph: number | null;
  windDir: string | null;
}

async function fetchForecast(): Promise<ForecastResult> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LOC.latitude}&longitude=${LOC.longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${encodeURIComponent(LOC.timezone)}&forecast_days=3`;
  const j = await fetchJson(url, "forecast");

  const cur = describeWeather(j.current.weather_code);
  const current: CurrentConditions = {
    tempF: j.current.temperature_2m != null ? Math.round(j.current.temperature_2m) : null,
    icon: cur.icon,
    condition: cur.condition,
  };

  const d = j.daily;
  const forecast: DayForecast[] = (d.time as string[]).map((date, i) => {
    const w = describeWeather(d.weather_code[i]);
    return {
      date,
      label: dayLabel(date, i),
      icon: w.icon,
      condition: w.condition,
      highF: d.temperature_2m_max?.[i] != null ? Math.round(d.temperature_2m_max[i]) : null,
      lowF: d.temperature_2m_min?.[i] != null ? Math.round(d.temperature_2m_min[i]) : null,
      precipProb: d.precipitation_probability_max?.[i] ?? null,
      windMph: d.wind_speed_10m_max?.[i] != null ? Math.round(d.wind_speed_10m_max[i]) : null,
    };
  });

  return {
    current,
    forecast,
    windMph: j.current.wind_speed_10m != null ? Math.round(j.current.wind_speed_10m) : null,
    windDir: compass(j.current.wind_direction_10m),
  };
}

type OceanPartial = Pick<OceanConditions, "waterTempF" | "waveHeightFt" | "wavePeriodS" | "swellHeightFt">;

async function fetchOcean(): Promise<OceanPartial> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${LOC.latitude}&longitude=${LOC.longitude}` +
    `&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature` +
    `&timezone=${encodeURIComponent(LOC.timezone)}`;
  const j = await fetchJson(url, "marine");
  const c = j.current ?? {};
  return {
    waterTempF: c.sea_surface_temperature != null ? Math.round(cToF(c.sea_surface_temperature)) : null,
    waveHeightFt: c.wave_height != null ? Number(mToFt(c.wave_height).toFixed(1)) : null,
    wavePeriodS: c.wave_period != null ? Math.round(c.wave_period) : null,
    swellHeightFt: c.swell_wave_height != null ? Number(mToFt(c.swell_wave_height).toFixed(1)) : null,
  };
}

async function fetchTides(): Promise<TideEvent[]> {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=SeaRobinClassic` +
    `&datum=MLLW&station=${LOC.noaaStationId}&time_zone=lst_ldt&units=english&interval=hilo&format=json` +
    `&begin_date=${ymd}&range=72`;
  const j = await fetchJson(url, "tides");
  if (!Array.isArray(j.predictions)) return [];
  return j.predictions.map((p: { t: string; v: string; type: string }) => ({
    time: new Date(p.t.replace(" ", "T")).getTime(),
    type: p.type === "H" ? ("HIGH" as const) : ("LOW" as const),
    heightFt: Number(parseFloat(p.v).toFixed(1)),
  }));
}

export async function fetchMarineReport(): Promise<MarineReport> {
  const [fc, oc, td] = await Promise.allSettled([fetchForecast(), fetchOcean(), fetchTides()]);

  const forecast = fc.status === "fulfilled" ? fc.value : null;
  const oceanPartial: Partial<OceanPartial> = oc.status === "fulfilled" ? oc.value : {};
  const tides = td.status === "fulfilled" ? td.value : [];

  const hasOcean = forecast != null || Object.keys(oceanPartial).length > 0;
  const ocean: OceanConditions | null = hasOcean
    ? {
        waterTempF: oceanPartial.waterTempF ?? null,
        waveHeightFt: oceanPartial.waveHeightFt ?? null,
        wavePeriodS: oceanPartial.wavePeriodS ?? null,
        swellHeightFt: oceanPartial.swellHeightFt ?? null,
        windMph: forecast?.windMph ?? null,
        windDir: forecast?.windDir ?? null,
      }
    : null;

  return {
    fetchedAt: Date.now(),
    current: forecast?.current ?? null,
    forecast: forecast?.forecast ?? [],
    ocean,
    tides,
  };
}
