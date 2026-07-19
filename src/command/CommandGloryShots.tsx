import { useEffect, useState } from "react";
import { listGloryFavHistory, type GloryFavHistoryEntry } from "../data/repository";
import { Photo } from "../components/BlobImage";
import { Icon } from "../components/Icon";

/** The permanent Glory Shot Fav archive — one row per year, expandable to a
 * row of thumbnails for that year's ballot, each opening a lightbox. */
export function CommandGloryShots() {
  const [entries, setEntries] = useState<GloryFavHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<GloryFavHistoryEntry | null>(null);

  useEffect(() => {
    listGloryFavHistory().then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, []);

  const byYear = new Map<number, GloryFavHistoryEntry[]>();
  for (const e of entries) {
    const arr = byYear.get(e.year) ?? [];
    arr.push(e);
    byYear.set(e.year, arr);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);
  const cols = "100px 1fr 140px 40px";

  return (
    <div className="page">
      <h2 className="page-title">Glory Shots</h2>
      <p className="page-sub">The permanent Glory Shot Fav archive — every ballot, year over year.</p>

      {loading && <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>Loading…</p>}
      {!loading && years.length === 0 && (
        <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>No archived ballots yet.</p>
      )}

      {years.length > 0 && (
        <div className="cc-catch-table">
          <div className="cc-catch-row cc-catch-head" style={{ gridTemplateColumns: cols }}>
            <div>Year</div>
            <div>Winner</div>
            <div>Nominees</div>
            <div />
          </div>
          {years.map((year) => {
            const rows = [...(byYear.get(year) ?? [])].sort((a, b) => b.votes - a.votes);
            const winners = rows.filter((r) => r.isWinner).map((r) => r.submitter);
            const isOpen = openYear === year;
            return (
              <div key={year}>
                <button
                  type="button"
                  className="cc-catch-row"
                  style={{ gridTemplateColumns: cols, cursor: "pointer", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--line)" }}
                  onClick={() => setOpenYear(isOpen ? null : year)}
                  aria-expanded={isOpen}
                >
                  <div>{year}</div>
                  <div style={{ color: "var(--gold)", fontWeight: 700 }}>{winners.join(", ") || "—"}</div>
                  <div>
                    {rows.length} {rows.length === 1 ? "photo" : "photos"}
                  </div>
                  <Icon name="next" size={16} className={`collapse-chevron ${isOpen ? "open" : ""}`} />
                </button>
                {isOpen && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                    {rows.map((r) =>
                      r.photoUrl ? (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => setLightbox(r)}
                          style={{ padding: 0, border: "none", background: "none", cursor: "pointer", position: "relative" }}
                          title={`${r.submitter} · ${r.votes} ${r.votes === 1 ? "vote" : "votes"}`}
                        >
                          <Photo url={r.photoUrl} alt={r.submitter} className="glory-admin-thumb" />
                          {r.isWinner && (
                            <span
                              style={{
                                position: "absolute", top: -4, right: -4, background: "var(--gold)", color: "var(--on-accent)",
                                borderRadius: "50%", width: 18, height: 18, display: "grid", placeItems: "center",
                              }}
                            >
                              <Icon name="trophy" size={11} />
                            </span>
                          )}
                        </button>
                      ) : (
                        <div
                          key={r.id}
                          className="tag"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12.5 }}
                          title={r.description}
                        >
                          {r.isWinner && <Icon name="trophy" size={12} style={{ color: "var(--gold)" }} />}
                          {r.submitter}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Photo url={lightbox.photoUrl} alt={lightbox.submitter} />
            <div style={{ color: "var(--sand)", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {lightbox.isWinner && <Icon name="trophy" size={15} style={{ color: "var(--gold)", verticalAlign: "-2px", marginRight: 6 }} />}
                {lightbox.submitter}
              </div>
              {lightbox.description && <div style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 4 }}>{lightbox.description}</div>}
              <div style={{ color: "var(--sand-faint)", fontSize: 12.5, marginTop: 4 }}>
                {lightbox.votes} {lightbox.votes === 1 ? "vote" : "votes"} · {lightbox.year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
