import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { RoleBadge } from "../components/RoleBadge";
import { CatchCard } from "../components/CatchCard";
import { BackButton } from "../components/BackButton";
import { Icon } from "../components/Icon";
import { Badges } from "../components/Badges";
import { findAccolade, shinerSeasons, presidencyYears } from "../domain/accolades";

export function ProfilePage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const user = useLiveQuery(() => db.users.get(userId), [userId]);
  const catches = useLiveQuery(
    () => db.catches.where("userId").equals(userId).reverse().sortBy("createdAt"),
    [userId],
    [],
  );

  const accolade = user ? findAccolade({ email: user.email, name: user.name }) : undefined;

  if (!user) return null;

  const approved = catches.filter((c) => c.status === "APPROVED");
  const careerPoints = approved.reduce((s, c) => s + c.pointValue, 0);
  const largest = approved.reduce((m, c) => Math.max(m, c.lengthInches), 0);
  const seaRobins = approved.filter((c) => c.species === "Sea Robin").length;
  const trophies = approved.filter((c) => c.isTrophy).length;
  const recordsBroken = approved.filter((c) => c.isRecordBreaker).length;

  // Shiner Club: years fished with zero approved points
  const years = [...new Set(catches.map((c) => c.tournamentYear))];
  const shinerYears = years.filter(
    (y) => approved.filter((c) => c.tournamentYear === y).length === 0,
  );

  return (
    <div className="page">
      <BackButton onBack={onBack} />
      <div className="page-kicker" style={{ marginTop: 12 }}>Career file</div>
      <h2 className="page-title">
        {user.name}
        {user.nickname ? ` "${user.nickname}"` : ""}
      </h2>
      <p className="page-sub">
        <RoleBadge role={user.roleTag} /> · on the roster since{" "}
        {new Date(user.createdAt).getFullYear()}
      </p>

      {accolade && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="award" size={17} /> Accolades
          </h3>
          <Badges accolade={accolade} />
          <div style={{ color: "var(--sand-faint)", fontSize: 12.5 }}>
            {accolade.careerTotal.toLocaleString()} career points · {accolade.years} tournaments
            {presidencyYears(accolade).length > 0 ? ` · ${presidencyYears(accolade).length}× Shiner Club President` : ""}
            {shinerSeasons(accolade) > 0 ? ` · ${shinerSeasons(accolade)} Shiner seasons` : ""}
            {accolade.placeThisYear ? ` · #${accolade.placeThisYear} this year` : ""}
          </div>
        </div>
      )}

      <div className="stat-grid stagger" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="value">{careerPoints.toLocaleString()}</div>
          <div className="label">Career points</div>
        </div>
        <div className="stat">
          <div className="value">{largest > 0 ? `${largest}"` : "—"}</div>
          <div className="label">Largest fish</div>
        </div>
        <div className="stat">
          <div className="value">{seaRobins}</div>
          <div className="label">Career Sea Robins</div>
        </div>
        <div className="stat">
          <div className="value">{approved.length}</div>
          <div className="label">Fish landed</div>
        </div>
        <div className="stat">
          <div className="value">{trophies}</div>
          <div className="label">Trophy fish</div>
        </div>
        <div className="stat">
          <div className="value">{recordsBroken}</div>
          <div className="label">Records broken</div>
        </div>
      </div>

      {shinerYears.length > 0 && (
        <div className="ai-verdict warn" style={{ marginBottom: 14, display: "flex", gap: 8 }}>
          <Icon name="award" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Shiner Club member — {shinerYears.length} year{shinerYears.length > 1 ? "s" : ""} on the
            board with a goose egg ({shinerYears.join(", ")}). Wear it proudly.
          </span>
        </div>
      )}

      <h3 style={{ fontFamily: "var(--font-head)", textTransform: "uppercase", letterSpacing: 1.2, fontSize: 13, fontWeight: 700, color: "var(--sand-dim)", margin: "8px 0 10px" }}>
        Catch history
      </h3>
      {catches.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="fish" size={30} />
          </div>
          No catches on file. Yet.
        </div>
      )}
      {catches.map((c) => (
        <CatchCard key={c.id} entry={c} />
      ))}
    </div>
  );
}
