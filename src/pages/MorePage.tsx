import { useApp } from "../context/AppContext";
import { RoleBadge } from "../components/RoleBadge";
import { Icon, type IconName } from "../components/Icon";
import type { Screen } from "../App";

export function MorePage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, logout } = useApp();
  if (!user) return null;

  const items: { screen: Screen; icon: IconName; title: string; sub: string; mocOnly?: boolean }[] = [
    { screen: "profile", icon: "user", title: "My Career", sub: "Stats, catches, Shiner Club history" },
    { screen: "records", icon: "award", title: "Record Book", sub: "Standing Sea Robin records by species" },
    { screen: "glory", icon: "camera", title: "Glory Shots", sub: "Off-season feed — summer catches" },
    { screen: "memories", icon: "archive", title: "Memories Vault", sub: "The archive: SRC 1999–2001" },
    { screen: "admin", icon: "shield", title: "M.O.C. Panel", sub: "Roster, catches, scoring config", mocOnly: true },
  ];

  return (
    <div className="page">
      <div className="page-kicker">Roster</div>
      <h2 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {user.name} <RoleBadge role={user.roleTag} />
      </h2>
      <p className="page-sub">{user.email}</p>

      <div className="stagger">
        {items
          .filter((i) => !i.mocOnly || user.roleTag === "MOC")
          .map((i) => (
            <div className="lb-row" key={i.screen} role="button" onClick={() => onNavigate(i.screen)}>
              <div className="rank" style={{ color: "var(--flare)" }}>
                <Icon name={i.icon} size={22} />
              </div>
              <div className="who">
                <div className="name">{i.title}</div>
                <div className="meta">{i.sub}</div>
              </div>
              <div style={{ color: "var(--sand-faint)", display: "grid" }}>
                <Icon name="next" size={18} />
              </div>
            </div>
          ))}
      </div>

      <button className="btn ghost" style={{ marginTop: 16 }} onClick={logout}>
        <Icon name="logout" size={18} /> Log out
      </button>
    </div>
  );
}
