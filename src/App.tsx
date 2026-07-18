import { useState } from "react";
import { useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { InstallPrompt } from "./components/InstallPrompt";
import { TabBar, type Tab } from "./components/TabBar";
import { LoginPage } from "./pages/LoginPage";
import { UpdatePasswordPage } from "./pages/UpdatePasswordPage";
import { ScorecardPage } from "./pages/ScorecardPage";
import { SubmitCatchPage } from "./pages/SubmitCatchPage";
import { RulesPage } from "./pages/RulesPage";
import { MorePage } from "./pages/MorePage";
import { RecordsPage } from "./pages/RecordsPage";
import { GloryPicsPage } from "./pages/GloryPicsPage";
import { MemoriesPage } from "./pages/MemoriesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { NewsletterPage } from "./pages/NewsletterPage";
import { ResultsPage } from "./pages/ResultsPage";
import { FindAnglerPage } from "./pages/FindAnglerPage";
import { GloryFavArchivePage } from "./pages/GloryFavArchivePage";
import { Icon } from "./components/Icon";

export type Screen =
  | Tab
  | "records"
  | "memories"
  | "profile"
  | "admin"
  | "newsletter"
  | "results"
  | "scorecards"
  | "find-angler"
  | "glory-archive";

export default function App() {
  const { user, ready, recovery } = useApp();
  const [screen, setScreen] = useState<Screen>("leaderboard");
  const [focusAngler, setFocusAngler] = useState<string | null>(null);

  const viewAngler = (id: string) => {
    setFocusAngler(id);
    setScreen("admin"); // scorecard review now lives inside the M.O.C. Panel
  };

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

  // A password-reset link lands the user in a recovery session — collect the new
  // password before anything else, whether or not a profile is loaded yet.
  if (recovery) return <UpdatePasswordPage />;

  if (!user) return <LoginPage />;

  const tab: Tab = (["leaderboard", "submit", "glory", "rules", "more"] as Tab[]).includes(
    screen as Tab,
  )
    ? (screen as Tab)
    : "more";

  return (
    <div className="app-shell">
      <Header />
      <InstallPrompt />
      {screen === "leaderboard" && (
        <ScorecardPage
          onViewResults={() => setScreen("results")}
          onViewAngler={viewAngler}
          onGoVote={() => setScreen("glory")}
        />
      )}
      {screen === "submit" && <SubmitCatchPage onDone={() => setScreen("leaderboard")} />}
      {screen === "rules" && <RulesPage />}
      {screen === "more" && <MorePage onNavigate={setScreen} />}
      {screen === "records" && <RecordsPage onBack={() => setScreen("more")} />}
      {screen === "glory" && <GloryPicsPage />}
      {screen === "memories" && <MemoriesPage onBack={() => setScreen("more")} />}
      {screen === "profile" && (
        <ProfilePage userId={user.id} onBack={() => setScreen("more")} />
      )}
      {screen === "admin" && (
        <AdminPage
          onBack={() => setScreen("more")}
          focusAngler={focusAngler}
          onFocusHandled={() => setFocusAngler(null)}
        />
      )}
      {screen === "newsletter" && <NewsletterPage onBack={() => setScreen("more")} />}
      {screen === "results" && <ResultsPage onBack={() => setScreen("more")} />}
      {screen === "find-angler" && <FindAnglerPage onBack={() => setScreen("more")} />}
      {screen === "glory-archive" && <GloryFavArchivePage onBack={() => setScreen("more")} />}
      <TabBar active={tab} onChange={(t) => setScreen(t)} />
    </div>
  );
}
