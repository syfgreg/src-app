import { useApp } from "../context/AppContext";
import { RoleBadge } from "../components/RoleBadge";
import type { Screen } from "../App";

export function MorePage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, logout } = useApp();
  if (!user) return null;

  const items: { screen: Screen; icon: string; title: string; sub: string; mocOnly?: boolean }[] = [
    { screen: "profile", icon: "🎣", title: "My Career", sub: "Stats, catches, Shiner Club history" },
    { screen: "records", icon: "📜", title: "Record Book", sub: "Standing Sea Robin records by species" },
    { screen: "glory", icon: "📸", title: "Glory Pics", sub: "Off-season feed — summer catches" },
    { screen: "memories", icon: "🗄️", title: "Memories Vault", sub: "The archive: SRC 1999–2001" },
    { screen: "admin", icon: "🧿", title: "M.O.C. Panel", sub: "Roster, catches, scoring config", mocOnly: true },
  ];

  return (
    <div className="page">
      <div className="page-kicker">Roster</div>
      <h2 className="page-title">
        {user.name} <RoleBadge role={user.roleTag} />
      </h2>
      <p className="page-sub">{user.email}</p>

      {items
        .filter((i) => !i.mocOnly || user.roleTag === "MOC")
        .map((i) => (
          <div className="lb-row" key={i.screen} role="button" onClick={() => onNavigate(i.screen)}>
            <div className="rank" style={{ fontSize: 24 }}>{i.icon}</div>
            <div className="who">
              <div className="name">{i.title}</div>
              <div className="meta">{i.sub}</div>
            </div>
            <div style={{ color: "var(--sand-faint)" }}>›</div>
          </div>
        ))}

      <button className="btn ghost" style={{ marginTop: 16 }} onClick={logout}>
        Log out
      </button>
    </div>
  );
}
