export type Tab = "leaderboard" | "submit" | "rules" | "more";

const TABS: { id: Tab; label: string; icon: string; cls?: string }[] = [
  { id: "leaderboard", label: "Leaders", icon: "🏆" },
  { id: "submit", label: "Log Catch", icon: "🐟", cls: "submit-tab" },
  { id: "rules", label: "Rules AI", icon: "⚖️" },
  { id: "more", label: "More", icon: "☰" },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`${active === t.id ? "active" : ""} ${t.cls ?? ""}`}
          onClick={() => onChange(t.id)}
        >
          <span className="ico">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
