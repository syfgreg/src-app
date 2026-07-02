import { useMemo, useState } from "react";
import { MEMORIES, MEMORY_YEARS } from "../data/seed";

export function MemoriesPage({ onBack }: { onBack: () => void }) {
  const [year, setYear] = useState(MEMORY_YEARS[0]);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const photos = useMemo(
    () =>
      MEMORIES.filter(
        (m) =>
          m.year === year &&
          (!query.trim() || m.caption.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [year, query],
  );

  return (
    <div className="page">
      <button className="btn ghost small" onClick={onBack}>‹ Back</button>
      <div className="page-kicker" style={{ marginTop: 12 }}>The Archive</div>
      <h2 className="page-title">Memories Vault</h2>
      <p className="page-sub">Photos, legends, and questionable decisions — organized by year.</p>

      <div className="year-tabs">
        {MEMORY_YEARS.map((y) => (
          <button key={y} className={y === year ? "active" : ""} onClick={() => setYear(y)}>
            SRC {y}
          </button>
        ))}
      </div>

      <label className="field">
        <span>Search the vault</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="fire, night, banner…" />
      </label>

      <div className="photo-grid">
        {photos.map((m) => (
          <figure key={m.src} onClick={() => setOpen(m.src)}>
            <img src={m.src} alt={m.caption} />
            <figcaption>{m.caption}</figcaption>
          </figure>
        ))}
      </div>
      {photos.length === 0 && (
        <div className="empty-state">
          <div className="big">🗄️</div>Nothing in the vault matches.
        </div>
      )}

      {open && (
        <div className="lightbox" onClick={() => setOpen(null)}>
          <img src={open} alt="Memory" />
        </div>
      )}
    </div>
  );
}
