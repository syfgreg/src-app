import { useEffect, useMemo, useState } from "react";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";
import { Badges, badgeSummary } from "../components/Badges";
import { searchAnglers, shinerSeasons, presidencyYears, type Accolade } from "../domain/accolades";

/**
 * Search every S.R.C. angler — past and present — from the cumulative standings,
 * and review their career file (accreditation badges + stats + season history).
 */
export function FindAnglerPage({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Accolade | null>(null);

  const results = useMemo(() => searchAnglers(query), [query]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selected]);

  if (selected) return <AnglerDetail angler={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>The whole roster, all-time</div>
      <h2 className="page-title">Find an Angler</h2>
      <p className="page-sub">Search any participant — past or present — and open their career file.</p>

      <div className="search-field">
        <Icon name="search" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          autoComplete="off"
          autoFocus
        />
      </div>

      <p className="page-sub" style={{ marginTop: 10 }}>
        {results.length} angler{results.length === 1 ? "" : "s"}
        {query ? "" : " · ranked by career points"}
      </p>

      <div className="stagger">
        {results.map((a, i) => (
          <div className="lb-row" key={a.id} role="button" onClick={() => setSelected(a)}>
            <div className="rank" style={{ color: "var(--flare)" }}>
              {query ? <Icon name="user" size={20} /> : i + 1}
            </div>
            <div className="who">
              <div className="name">{a.name}</div>
              <div className="meta">
                {badgeSummary(a) || `${a.years} tournaments · ${a.careerTotal.toLocaleString()} pts`}
              </div>
            </div>
            <div style={{ color: "var(--sand-faint)", display: "grid" }}>
              <Icon name="next" size={18} />
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="search" size={30} />
            </div>
            No angler matches “{query}”.
          </div>
        )}
      </div>
    </div>
  );
}

function AnglerDetail({ angler, onBack }: { angler: Accolade; onBack: () => void }) {
  const history = [...angler.history].sort((a, b) => a[0] - b[0]);
  const num = (p: (typeof history)[number][1]) => (typeof p === "number" ? p : 0); // DQ/ABD → 0 for the bar
  const maxPts = history.reduce((m, [, p]) => Math.max(m, num(p)), 0) || 1;
  const best = history.reduce((m, [, p]) => Math.max(m, num(p)), 0);
  const prezYears = new Set(presidencyYears(angler));

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>Career file</div>
      <h2 className="page-title">{angler.name}</h2>
      <p className="page-sub">
        {badgeSummary(angler) || "On the roster"}
        {angler.placeThisYear ? ` · #${angler.placeThisYear} this year` : ""}
      </p>

      <div className="card">
        <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="award" size={17} /> Accolades
        </h3>
        <Badges accolade={angler} />
      </div>

      <div className="stat-grid stagger" style={{ margin: "14px 0" }}>
        <div className="stat">
          <div className="value">{angler.careerTotal.toLocaleString()}</div>
          <div className="label">Career points</div>
        </div>
        <div className="stat">
          <div className="value">{angler.years}</div>
          <div className="label">Tournaments</div>
        </div>
        <div className="stat">
          <div className="value">{angler.championships}</div>
          <div className="label">Championships</div>
        </div>
        <div className="stat">
          <div className="value">{angler.recordsHeld}</div>
          <div className="label">Records held</div>
        </div>
        <div className="stat">
          <div className="value">{angler.elite3}</div>
          <div className="label">Elite-3 finishes</div>
        </div>
        <div className="stat">
          <div className="value">{best.toLocaleString()}</div>
          <div className="label">Best season</div>
        </div>
        <div className="stat">
          <div className="value">{shinerSeasons(angler)}</div>
          <div className="label">Shiner seasons</div>
        </div>
        {prezYears.size > 0 && (
          <div className="stat">
            <div className="value">{prezYears.size}</div>
            <div className="label">Shiner Club President</div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card">
          <h3>Season by season</h3>
          <div className="season-list">
            {history.map(([year, pts]) => (
              <div className="season-row" key={year}>
                <div className="season-year">{year}</div>
                <div className="season-bar-track">
                  <div
                    className="season-bar"
                    style={{ width: `${Math.max(2, Math.round((num(pts) / maxPts) * 100))}%`, opacity: num(pts) === 0 ? 0.25 : 1 }}
                  />
                </div>
                <div className="season-pts">
                  {typeof pts !== "number" ? (
                    <span className="season-dq">{pts}</span>
                  ) : pts === 0 ? (
                    prezYears.has(year) ? (
                      <span className="season-prez">Shiner Pres.</span>
                    ) : (
                      <span className="season-shiner">Shiner</span>
                    )
                  ) : (
                    pts.toLocaleString()
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
