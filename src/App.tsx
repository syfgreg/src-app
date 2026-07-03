import { useState } from "react";
import { useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { TabBar, type Tab } from "./components/TabBar";
import { LoginPage } from "./pages/LoginPage";
import { ScorecardPage } from "./pages/ScorecardPage";
import { SubmitCatchPage } from "./pages/SubmitCatchPage";
import { RulesPage } from "./pages/RulesPage";
import { MorePage } from "./pages/MorePage";
import { RecordsPage } from "./pages/RecordsPage";
import { GloryPicsPage } from "./pages/GloryPicsPage";
import { MemoriesPage } from "./pages/MemoriesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { Icon } from "./components/Icon";

export type Screen =
  | Tab
  | "records"
  | "glory"
  | "memories"
  | "profile"
  | "admin";

export default function App() {
  const { user, ready } = useApp();
  const [screen, setScreen] = useState<Screen>("leaderboard");

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="empty-state" style={{ paddingTop: "40dvh" }}>
          <div className="empty-icon">
            <Icon name="waves" size={30} />
          </div>
          Casting lines…
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const tab: Tab = (["leaderboard", "submit", "rules", "more"] as Tab[]).includes(
    screen as Tab,
  )
    ? (screen as Tab)
    : "more";

  return (
    <div className="app-shell">
      <Header />
      {screen === "leaderboard" && <ScorecardPage />}
      {screen === "submit" && <SubmitCatchPage onDone={() => setScreen("leaderboard")} />}
      {screen === "rules" && <RulesPage />}
      {screen === "more" && <MorePage onNavigate={setScreen} />}
      {screen === "records" && <RecordsPage onBack={() => setScreen("more")} />}
      {screen === "glory" && <GloryPicsPage onBack={() => setScreen("more")} />}
      {screen === "memories" && <MemoriesPage onBack={() => setScreen("more")} />}
      {screen === "profile" && (
        <ProfilePage userId={user.id} onBack={() => setScreen("more")} />
      )}
      {screen === "admin" && <AdminPage onBack={() => setScreen("more")} />}
      <TabBar active={tab} onChange={(t) => setScreen(t)} />
    </div>
  );
}
