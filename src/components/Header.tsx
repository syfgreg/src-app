import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "./Icon";

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const notifications = useLiveQuery(
    () => db.notifications.orderBy("at").reverse().limit(40).toArray(),
    [],
    [],
  );
  const unread = notifications.filter((n) => !n.read).length;

  const openDrawer = async () => {
    setOpen(true);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    await db.notifications.toCollection().modify({ read: true });
  };

  return (
    <>
      <header className="app-header">
        <div className="logo-chip">
          <img src="/logo.png" alt="Sea Robin Classic" />
        </div>
        <div>
          <h1>
            SEA ROBIN <span>CLASSIC</span>
          </h1>
          <div className="sub">Surf Fishing Tournament</div>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={toggle} aria-label="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
          </button>
          <button className="header-btn" onClick={openDrawer} aria-label="Notifications">
            <Icon name="bell" size={19} />
            {unread > 0 && <span className="dot">{unread}</span>}
          </button>
        </div>
      </header>
      {open && (
        <div className="notif-drawer" onClick={() => setOpen(false)}>
          <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                fontFamily: "var(--font-head)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--sand-dim)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="bell" size={16} /> Live Wire
            </h3>
            {notifications.length === 0 && (
              <p style={{ color: "var(--sand-faint)", fontSize: 14 }}>
                Quiet surf. Verified catches will be broadcast here the second they land.
              </p>
            )}
            {notifications.map((n) => (
              <div className="notif-item" key={n.id}>
                {n.message}
                <time>{new Date(n.at).toLocaleString()}</time>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
