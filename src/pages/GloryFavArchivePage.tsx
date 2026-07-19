import { useEffect, useState } from "react";
import { listGloryFavHistory, type GloryFavHistoryEntry } from "../data/repository";
import { Photo } from "../components/BlobImage";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";

/**
 * The permanent Glory Shot Fav archive — read-only for everyone, anglers and
 * M.O.C. alike. Nothing here is deletable; it's history. Mobile counterpart
 * to the Command Center's Glory Shots tab (same data, same lightbox pattern,
 * different layout: collapsible year cards instead of a table).
 */
export function GloryFavArchivePage({ onBack }: { onBack: () => void }) {
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

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>The Archive</div>
      <h2 className="page-title">Glory Shots Archive</h2>
      <p className="page-sub">Every Glory Shot Fav ballot, year over year.</p>

      {loading && <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>Loading…</p>}
      {!loading && years.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="camera" size={30} />
          </div>
          No archived ballots yet.
        </div>
      )}

      <div className="stagger">
        {years.map((year) => {
          const rows = [...(byYear.get(year) ?? [])].sort((a, b) => b.votes - a.votes);
          const winners = rows.filter((r) => r.isWinner).map((r) => r.submitter);
          const isOpen = openYear === year;
          return (
            <div className="card" key={year}>
              <button
                type="button"
                className="collapse-head"
                aria-expanded={isOpen}
                onClick={() => setOpenYear(isOpen ? null : year)}
                style={{ width: "100%", background: "none", border: 0, padding: 0, cursor: "pointer", display: "flex", alignItems: "center", textAlign: "left" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{year}</div>
                  <div style={{ color: "var(--sand-faint)", fontSize: 12.5, marginTop: 2 }}>
                    {winners.length > 0 ? `🏆 ${winners.join(", ")}` : "No winner recorded"} · {rows.length}{" "}
                    {rows.length === 1 ? "photo" : "photos"}
                  </div>
                </div>
                <Icon name="next" size={18} className={`collapse-chevron ${isOpen ? "open" : ""}`} />
              </button>
              {isOpen && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  {rows.map((r) =>
                    r.photoUrl ? (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setLightbox(r)}
                        style={{ padding: 0, border: "none", background: "none", cursor: "pointer", position: "relative" }}
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

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Photo url={lightbox.photoUrl} alt={lightbox.submitter} />
            <div style={{ color: "var(--sand)", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {lightbox.isWinner && (
                  <Icon name="trophy" size={15} style={{ color: "var(--gold)", verticalAlign: "-2px", marginRight: 6 }} />
                )}
                {lightbox.submitter}
              </div>
              {lightbox.description && (
                <div style={{ color: "var(--sand-dim)", fontSize: 13.5, marginTop: 4 }}>{lightbox.description}</div>
              )}
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
