import { useState } from "react";
import { Icon } from "./Icon";
import { useForecast } from "../hooks/useForecast";
import { TOURNAMENT_LOCATION } from "../domain/location";
import type { MarineReport } from "../data/weather";

/**
 * Header control: shows the current condition icon + temperature and opens a
 * slide-in 3-day forecast for the tournament beach.
 */
export function WeatherButton() {
  const [open, setOpen] = useState(false);
  const { report, loading } = useForecast();
  const current = report?.current;

  // Header glyph must stay visually distinct from the theme toggle (sun / moon).
  // A clear sky resolves to "sun" — same as the dark-mode toggle — so show the
  // partly-cloudy glyph instead; every other condition is already distinct.
  const headerIcon = !current?.icon || current.icon === "sun" ? "cloud-sun" : current.icon;

  return (
    <>
      <button
        className="header-btn"
        onClick={() => setOpen(true)}
        aria-label="3-day beach forecast"
      >
        <Icon name={headerIcon} size={19} />
      </button>
      {open && <ForecastDrawer report={report} loading={loading} onClose={() => setOpen(false)} />}
    </>
  );
}

interface DrawerProps {
  report: MarineReport | null;
  loading: boolean;
  onClose: () => void;
}

function ForecastDrawer({ report, loading, onClose }: DrawerProps) {
  const current = report?.current;
  const days = report?.forecast ?? [];

  return (
    <div className="notif-drawer" onClick={onClose}>
      <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
        <h3
          style={{
            fontFamily: "var(--font-head)",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--sand-dim)",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="cloud-sun" size={16} /> 3-Day Forecast
        </h3>
        <div className="forecast-loc">
          <Icon name="pin" size={14} /> {TOURNAMENT_LOCATION.name} · {TOURNAMENT_LOCATION.region}
        </div>

        {current && (
          <div className="forecast-now">
            <Icon name={current.icon} size={46} className="now-ico" strokeWidth={1.6} />
            <div>
              <div className="now-temp">{current.tempF != null ? `${current.tempF}°` : "—"}</div>
              <div className="now-cond">{current.condition} · right now</div>
            </div>
          </div>
        )}

        {days.map((d) => (
          <div className="forecast-day" key={d.date}>
            <Icon name={d.icon} size={24} className="fd-ico" strokeWidth={1.7} />
            <div className="fd-label">
              {d.label}
              <div className="fd-cond">{d.condition}</div>
            </div>
            <div className="fd-precip">
              {d.precipProb != null && d.precipProb > 0 ? `${d.precipProb}%` : ""}
            </div>
            <div className="fd-temp">
              {d.highF != null ? `${d.highF}°` : "—"}
              <span className="lo"> / {d.lowF != null ? `${d.lowF}°` : "—"}</span>
            </div>
          </div>
        ))}

        {days.length === 0 && (
          <p style={{ color: "var(--sand-faint)", fontSize: 14, padding: "8px 0" }}>
            {loading ? "Reading the sky…" : "Forecast unavailable — check your connection."}
          </p>
        )}

        <div className="forecast-foot">
          Forecast by Open-Meteo. Highs / lows in °F, chance of rain at right.
          {report?.fetchedAt ? ` Updated ${new Date(report.fetchedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.` : ""}
        </div>
      </div>
    </div>
  );
}
