import { Icon, type IconName } from "./Icon";
import type { Accolade } from "../domain/accolades";
import { hasAnyAccolade, shinerSeasons, presidencyYears } from "../domain/accolades";

/**
 * Salesforce-accreditation-style achievement badges earned from the cumulative
 * standings. Count badges (championships / records / elite-3) show a count pill;
 * status badges (Grand Robin / M.O.C.) are earned honors with no count. Only the
 * badges an angler has actually earned are rendered.
 */

interface CountBadge {
  kind: "count";
  key: string;
  count: number;
  label: string;
  icon: IconName;
  variant: string;
}
interface StatusBadge {
  kind: "status";
  key: string;
  label: string;
  icon?: IconName;
  logo?: boolean;
  /** portrait image filling the medal (e.g. the M.O.C. mascot) */
  image?: string;
  variant: string;
}
type BadgeDef = CountBadge | StatusBadge;

function buildBadges(a: Accolade): BadgeDef[] {
  const out: BadgeDef[] = [];
  if (a.moc)
    out.push({ kind: "status", key: "moc", label: "M.O.C.", image: "/moc.png", variant: "v-moc" });
  if (a.grandRobin)
    out.push({ kind: "status", key: "gr", label: "Grand Robin", image: "/grand-robin.png", variant: "v-gr" });
  if (a.championships > 0)
    out.push({ kind: "count", key: "champ", count: a.championships, label: "Championships", icon: "trophy", variant: "v-champ" });
  if (a.recordsHeld > 0)
    out.push({ kind: "count", key: "record", count: a.recordsHeld, label: "Records Held", icon: "award", variant: "v-record" });
  if (a.elite3 > 0)
    out.push({ kind: "count", key: "elite", count: a.elite3, label: "Elite-3 Finishes", icon: "sparkle", variant: "v-elite" });
  // Shiner Club President: the reigning champion of blanking — a pewter seal.
  const prez = presidencyYears(a).length;
  if (prez > 0)
    out.push({ kind: "count", key: "prez", count: prez, label: "Shiner Club President", icon: "shield", variant: "v-prez" });
  // Shiner: a wry "anti-badge" for years fished with zero points — a tarnished coin.
  const shiners = shinerSeasons(a);
  if (shiners > 0)
    out.push({ kind: "count", key: "shiner", count: shiners, label: "Shiner Seasons", icon: "fish", variant: "v-shiner" });
  return out;
}

export function Badges({ accolade, emptyHint = true }: { accolade: Accolade; emptyHint?: boolean }) {
  const badges = buildBadges(accolade);

  if (badges.length === 0) {
    return emptyHint ? (
      <p className="badge-empty">No accolades on the wall yet — the beach is patient.</p>
    ) : null;
  }

  return (
    <div className="badge-wall">
      {badges.map((b) => (
        <div className="badge" key={b.key} title={b.label}>
          <div className={`badge-medal ${b.variant}`}>
            {b.kind === "status" && b.image ? (
              <img src={b.image} alt="" className="badge-portrait" />
            ) : b.kind === "status" && b.logo ? (
              <img src="/logo.png" alt="" className="badge-logo" />
            ) : (
              <Icon name={(b as CountBadge).icon ?? (b as StatusBadge).icon ?? "award"} size={30} strokeWidth={1.9} />
            )}
            {b.kind === "count" && <span className="badge-count">{b.count}</span>}
            <span className="badge-shine" aria-hidden />
          </div>
          <div className="badge-label">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Compact single-line summary of a member's honors (for list rows). */
export function badgeSummary(a: Accolade): string {
  const bits: string[] = [];
  if (a.moc) bits.push("M.O.C.");
  if (a.grandRobin) bits.push("Grand Robin");
  if (a.championships > 0) bits.push(`${a.championships}x Champion`);
  if (a.recordsHeld > 0) bits.push(`${a.recordsHeld} record${a.recordsHeld > 1 ? "s" : ""}`);
  if (a.elite3 > 0) bits.push(`${a.elite3}x Elite-3`);
  const prez = presidencyYears(a).length;
  if (prez > 0) bits.push(`${prez}x Shiner President`);
  const sh = shinerSeasons(a);
  if (sh > 0) bits.push(`${sh} Shiner${sh > 1 ? "s" : ""}`);
  return bits.join(" · ");
}

export { hasAnyAccolade };
