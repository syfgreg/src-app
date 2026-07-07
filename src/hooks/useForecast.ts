import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMarineReport, type MarineReport } from "../data/weather";

const CACHE_KEY = "src-marine-report";
const REFRESH_MS = 30 * 60 * 1000; // refresh every 30 minutes while open

function readCache(): MarineReport | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as MarineReport) : null;
  } catch {
    return null;
  }
}

/**
 * Keep any part of the fresh report that actually returned data; otherwise fall
 * back to the previous value. A transient failure of one source (say tides)
 * never wipes the last good reading for that source.
 */
function mergeReport(prev: MarineReport | null, fresh: MarineReport): MarineReport {
  if (!prev) return fresh;
  return {
    fetchedAt: fresh.fetchedAt,
    current: fresh.current ?? prev.current,
    forecast: fresh.forecast.length ? fresh.forecast : prev.forecast,
    ocean: fresh.ocean ?? prev.ocean,
    tides: fresh.tides.length ? fresh.tides : prev.tides,
  };
}

/**
 * Offline-first weather/marine/tide report. Reads the cached report on mount
 * (instant paint), fetches fresh in the background, and refreshes on an
 * interval and on window focus.
 */
export function useForecast() {
  const [report, setReport] = useState<MarineReport | null>(readCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const fresh = await fetchMarineReport();
      const merged = mergeReport(readCache(), fresh);
      setReport(merged);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      } catch {
        /* storage full / disabled — non-fatal */
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "weather unavailable");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    const onFocus = () => {
      const c = readCache();
      if (!c || Date.now() - c.fetchedAt > REFRESH_MS) load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return { report, loading, error };
}
