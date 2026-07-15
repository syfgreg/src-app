import { Icon, type IconName } from "./Icon";

export type Tab = "leaderboard" | "submit" | "glory" | "rules" | "more";

// Log Catch (the raised + button) sits dead-center: Scorecard · Glory Shots ·
// Log Catch · Rules AI · More.
const TABS: { id: Tab; label: string; icon: IconName; cls?: string; size?: number }[] = [
  { id: "leaderboard", label: "Scorecard", icon: "scorecard" },
  { id: "glory", label: "Glory Shots", icon: "camera" },
  { id: "submit", label: "Log Catch", icon: "plus", cls: "submit-tab", size: 26 },
  { id: "rules", label: "SRC AI", icon: "rules" },
  { id: "more", label: "More", icon: "grid" },
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
          <span className="ico">
            <Icon name={t.icon} size={t.size ?? 22} strokeWidth={t.cls ? 2 : 1.85} />
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
