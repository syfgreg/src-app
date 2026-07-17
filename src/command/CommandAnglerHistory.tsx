import { useMemo, useState } from "react";
import { searchAnglers, shinerSeasons, type Accolade } from "../domain/accolades";
import { badgeSummary } from "../components/Badges";
import { AnglerDetail } from "../pages/FindAnglerPage";
import { Icon } from "../components/Icon";

/** Desktop data-table version of Angler History (mobile uses a simple list —
 * see FindAnglerPage). Same underlying data/search, just a denser table. */
export function CommandAnglerHistory() {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<Accolade | null>(null);

  const results = useMemo(() => {
    const list = searchAnglers(query); // already ranked by career total, descending
    return sortDesc ? list : [...list].reverse();
  }, [query, sortDesc]);

  if (selected) return <AnglerDetail angler={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="page">
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <div className="page-kicker">All-Time Career Files</div>
          <h2 className="page-title">Angler History</h2>
          <p className="page-sub">{results.length} anglers on record · every season since 1998.</p>
        </div>
        <div className="search-field" style={{ maxWidth: 280, flex: "1 1 220px" }}>
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any angler…"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="cc-angler-table">
        <div className="cc-angler-row cc-angler-head">
          <div className="cc-angler-rank">#</div>
          <div>Angler</div>
          <button type="button" className="cc-angler-sort" onClick={() => setSortDesc((d) => !d)}>
            Career Pts <Icon name="next" size={12} className={`collapse-chevron ${sortDesc ? "open" : ""}`} />
          </button>
          <div>Seasons</div>
          <div>Champs</div>
          <div>Records</div>
          <div>Shiners</div>
        </div>

        {results.map((a, i) => (
          <button type="button" className="cc-angler-row" key={a.id} onClick={() => setSelected(a)}>
            <div className="cc-angler-rank">{i + 1}</div>
            <div className="cc-angler-name">
              <div className="cc-angler-nm">{a.name}</div>
              <div className="cc-angler-sub">{badgeSummary(a) || "On the roster"}</div>
            </div>
            <div className="cc-angler-pts">{a.careerTotal.toLocaleString()}</div>
            <div>{a.years}</div>
            <div>{a.championships || "—"}</div>
            <div>{a.recordsHeld || "—"}</div>
            <div>{shinerSeasons(a)}</div>
          </button>
        ))}

        {results.length === 0 && (
          <p style={{ color: "var(--sand-faint)", fontSize: 14, padding: "20px" }}>No angler matches “{query}”.</p>
        )}
      </div>
    </div>
  );
}
