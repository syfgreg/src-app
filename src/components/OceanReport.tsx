import { Icon } from "./Icon";
import { useForecast } from "../hooks/useForecast";
import { TOURNAMENT_LOCATION } from "../domain/location";
import type { TideEvent } from "../data/weather";

const fmtTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

interface NextTides {
  rising: boolean | null;
  next: TideEvent[];
}

function nextTides(tides: TideEvent[]): NextTides {
  const now = Date.now();
  const upcoming = tides.filter((t) => t.time > now).sort((a, b) => a.time - b.time);
  const nextHigh = upcoming.find((t) => t.type === "HIGH");
  const nextLow = upcoming.find((t) => t.type === "LOW");
  const ordered = [nextHigh, nextLow]
    .filter((t): t is TideEvent => Boolean(t))
    .sort((a, b) => a.time - b.time);
  return {
    rising: upcoming.length ? upcoming[0].type === "HIGH" : null,
    next: ordered,
  };
}

/**
 * "Beach Report" — live ocean conditions (water temp, surf, wind) and the next
 * high / low tides for the tournament location. Renders whatever data is
 * available; degrades quietly if a source is offline.
 */
export function OceanReport() {
  const { report, loading } = useForecast();
  const ocean = report?.ocean;
  const tides = report?.tides ?? [];
  const { rising, next } = nextTides(tides);

  const hasAnything = Boolean(ocean) || next.length > 0;

  return (
    <div className="card ocean-card">
      <div className="oc-head">
        <div className="oc-title">
          <Icon name="waves" size={16} /> Beach Report
        </div>
        <div className="oc-loc">
          <Icon name="pin" size={12} /> {TOURNAMENT_LOCATION.name}
        </div>
      </div>

      {!hasAnything ? (
        <p className="oc-muted">
          {loading ? "Reading the water…" : "Ocean conditions unavailable — check your connection."}
        </p>
      ) : (
        <>
          <div className="oc-stats">
            <div className="oc-stat">
              <Icon name="thermometer" size={20} className="oc-ico" />
              <div className="oc-val">
                {ocean?.waterTempF != null ? ocean.waterTempF : "—"}
                <small>°F</small>
              </div>
              <div className="oc-lbl">Water</div>
            </div>
            <div className="oc-stat">
              <Icon name="waves" size={20} className="oc-ico" />
              <div className="oc-val">
                {ocean?.waveHeightFt != null ? ocean.waveHeightFt : "—"}
                <small> ft</small>
              </div>
              <div className="oc-lbl">Surf</div>
              {ocean?.wavePeriodS != null && <div className="oc-sub">{ocean.wavePeriodS}s period</div>}
            </div>
            <div className="oc-stat">
              <Icon name="wind" size={20} className="oc-ico" />
              <div className="oc-val">
                {ocean?.windMph != null ? ocean.windMph : "—"}
                <small> mph</small>
              </div>
              <div className="oc-lbl">Wind</div>
              {ocean?.windDir && <div className="oc-sub">out of {ocean.windDir}</div>}
            </div>
          </div>

          {next.length > 0 && (
            <div className="tide-block">
              <div className="tide-head">
                <span className="tide-label">Tides</span>
                {rising != null && (
                  <span className="tide-state">
                    <Icon name={rising ? "arrow-up" : "arrow-down"} size={13} />
                    {rising ? "Rising" : "Falling"}
                  </span>
                )}
              </div>
              <div className="tide-next">
                {next.map((t) => (
                  <div className="tide-item" key={t.time}>
                    <Icon name={t.type === "HIGH" ? "arrow-up" : "arrow-down"} size={18} className="ti-ico" />
                    <div>
                      <div className="ti-kind">{t.type === "HIGH" ? "Next High" : "Next Low"}</div>
                      <div className="ti-time">{fmtTime(t.time)}</div>
                      <div className="ti-ht">{t.heightFt} ft</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
