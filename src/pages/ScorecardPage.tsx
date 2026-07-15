import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { useApp } from "../context/AppContext";
import { RoleBadge } from "../components/RoleBadge";
import { Icon } from "../components/Icon";
import { OceanReport } from "../components/OceanReport";
import { computeStandings, anglerScore } from "../domain/standings";
import { isTrash, scoreCalc } from "../domain/scoring";
import type { CatchEntry } from "../domain/types";

interface ScorecardPageProps {
  onViewResults?: () => void;
  /** M.O.C. only — jump to a participant's scorecard from the live leaderboard. */
  onViewAngler?: (userId: string) => void;
  /** Jump to the Glory Shots page (Glory Shot Fav vote). */
  onGoVote?: () => void;
}

export function ScorecardPage({ onViewResults, onViewAngler, onGoVote }: ScorecardPageProps) {
  const { user } = useApp();
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const isMoc = user?.roleTag === "MOC";
  // The personal scorecard and the M.O.C. leaderboard are both collapsed by
  // default — tap their headers to expand.
  const [cardOpen, setCardOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

  // Active tournament (the registry row for this year) supplies its name + roster.
  // If more than one shares the year (legacy), the most recently started wins.
  const active = useLiveQuery(async () => {
    const list = await db.tournaments.where("year").equals(year).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [year]);
  const participantIds = active?.participantIds ?? [];

  // Scorecard identity: which tournament (name), season (year), and date it runs.
  const tournamentDate = active?.createdAt
    ? new Date(active.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "";
  const tournamentLabel = `Season ${year}${tournamentDate ? ` · ${tournamentDate}` : ""}`;

  // All approved catches for the year — the field the official standings need
  // (trash-3 cap, Full Monty, tie-breaks all require the whole field).
  const allApproved =
    useLiveQuery(
      () =>
        db.catches
          .where("tournamentYear")
          .equals(year)
          .and((c) => c.status === "APPROVED")
          .toArray(),
      [year],
      [] as CatchEntry[],
    ) ?? [];

  const penalties = useLiveQuery(
    () => db.penalties.where("tournamentYear").equals(year).toArray(),
    [year],
    [],
  ) ?? [];
  const penByUser = new Map<string, number>();
  for (const p of penalties) penByUser.set(p.userId, (penByUser.get(p.userId) ?? 0) + p.points);

  const live = { count: allApproved.length };

  // Live standings — M.O.C.-only, so anglers never see points mid-tournament.
  const allUsers = useLiveQuery(() => db.users.toArray(), [], []);
  const board = (() => {
    if (!isMoc) return null;
    const standings = computeStandings(allApproved, penByUser);
    const byUser = new Map(standings.map((s) => [s.userId, s]));
    const roster = participantIds.length ? new Set(participantIds) : null;
    const onRoster = (u: (typeof allUsers)[number]) => !roster || roster.has(u.id);
    // Preserve the official (tie-broken) ranking order. The M.O.C. fishes too and
    // their score shows in rightful order (they're just not prize-eligible), so
    // include the M.O.C. whenever they have catches — even though they're never
    // on the participant roster.
    return standings
      .map((s) => ({ u: allUsers.find((u) => u.id === s.userId), s }))
      .filter((r): r is { u: NonNullable<typeof r.u>; s: (typeof standings)[number] } =>
        !!r.u && (r.u.roleTag === "MOC" || onRoster(r.u)),
      )
      .map((r) => ({
        u: r.u,
        pts: r.s.total,
        count: r.s.approvedCount,
        fullMonty: r.s.fullMonty,
        isMoc: r.u.roleTag === "MOC",
      }))
      .concat(
        // roster anglers with no catches yet, so the M.O.C. sees the full field
        allUsers
          .filter((u) => u.roleTag !== "MOC" && onRoster(u) && !byUser.has(u.id))
          .map((u) => ({ u, pts: 0, count: 0, fullMonty: false, isMoc: false })),
      );
  })();

  // Prize ranks skip the M.O.C. (shown in score order but not prize-eligible).
  let rankCounter = 0;
  const rankedBoard = board?.map((row) => ({ ...row, rank: row.isMoc ? null : ++rankCounter }));

  const mine =
    useLiveQuery(
      () =>
        user
          ? db.catches
              .where("userId")
              .equals(user.id)
              .and((c) => c.tournamentYear === year)
              .reverse()
              .sortBy("createdAt")
          : Promise.resolve<CatchEntry[]>([]),
      [user?.id, year],
    ) ?? [];

  const myScore = user ? anglerScore(user.id, allApproved, penByUser) : null;
  const myTotal = myScore?.total ?? 0;

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-kicker">{active?.name ?? `S.R.C. ${year}`}</div>
      <h2 className="page-title">Tournament Live</h2>
      <p className="page-sub">{tournamentLabel} · the pulse of the beach, and your card.</p>

      {settings?.state === "PUBLISHED" && (
        <div
          className="results-banner"
          role={onViewResults ? "button" : undefined}
          onClick={onViewResults}
        >
          <Icon name="trophy" size={24} />
          <div className="rb-text">
            <b>Results are official</b>
            <span>Tap to see the final standings</span>
          </div>
          <Icon name="next" size={18} />
        </div>
      )}

      {settings?.gloryFavState === "OPEN" && (
        <div
          className="results-banner glory-vote-banner"
          role={onGoVote ? "button" : undefined}
          onClick={onGoVote}
        >
          <Icon name="camera" size={24} />
          <div className="rb-text">
            <b>Our Tournament has Ended!</b>
            <span>Go Vote for your Glory Shot Fav!</span>
          </div>
          <Icon name="next" size={18} />
        </div>
      )}

      <div className="live-panel">
        <img src="/src-emblem.png" alt="Sea Robin Classic emblem" className="live-emblem" />
        <div className="live-tag">
          <span className="live-dot" /> Live
        </div>
        <div className="big-count">{live?.count ?? 0}</div>
        <div className="count-label">Fish Landed Today</div>
      </div>

      {isMoc && settings?.state === "LIVE" && (
        <div className="card">
          <button
            type="button"
            className="scorecard-head collapse-head"
            style={{ marginBottom: boardOpen ? 4 : 0 }}
            aria-expanded={boardOpen}
            onClick={() => setBoardOpen((o) => !o)}
          >
            <div className="who">
              <div className="name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="trophy" size={18} /> Live Leaderboard
              </div>
              <div className="meta">
                M.O.C. eyes only · {board?.length ?? 0} {(board?.length ?? 0) === 1 ? "angler" : "anglers"} · tap to{" "}
                {boardOpen ? "hide" : "view"}
              </div>
            </div>
            <Icon name="next" size={18} className={`collapse-chevron ${boardOpen ? "open" : ""}`} />
          </button>
          {boardOpen &&
            (!rankedBoard || rankedBoard.length === 0 ? (
            <div className="empty-state" style={{ padding: "22px 12px" }}>
              <div className="empty-icon">
                <Icon name="waves" size={28} />
              </div>
              No verified catches yet.
            </div>
          ) : (
            <div className="stagger">
              {rankedBoard.map((row) => (
                <div
                  className={`lb-row ${row.rank === 1 ? "first" : row.rank === 2 ? "second" : row.rank === 3 ? "third" : ""}`}
                  key={row.u.id}
                  role={onViewAngler ? "button" : undefined}
                  onClick={onViewAngler ? () => onViewAngler(row.u.id) : undefined}
                  style={onViewAngler ? { cursor: "pointer" } : undefined}
                >
                  <div className="rank">{row.rank ?? "—"}</div>
                  <div className="who">
                    <div className="name" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>
                        {row.u.name}
                        {row.u.nickname ? ` "${row.u.nickname}"` : ""}
                      </span>
                      {row.isMoc && <span className="tag moc">M.O.C.</span>}
                    </div>
                    <div className="meta">
                      {row.count} verified {row.count === 1 ? "catch" : "catches"}
                      {row.isMoc ? " · not prize-eligible" : ""}
                    </div>
                  </div>
                  <div className="pts">
                    {row.pts.toLocaleString()}
                    <small>points</small>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <OceanReport />

      <div className="card">
        <button
          type="button"
          className="scorecard-head collapse-head"
          aria-expanded={cardOpen}
          onClick={() => setCardOpen((o) => !o)}
        >
          <div className="who">
            <div className="name">
              {user.name}
              {user.nickname ? ` "${user.nickname}"` : ""}
            </div>
            <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>{active?.name ?? `S.R.C. ${year}`} · {tournamentLabel}</span>
              <RoleBadge role={user.roleTag} />
              {myScore?.fullMonty && <span className="tag honor">Full Monty</span>}
              <span className="muted-hint">· {mine.length} {mine.length === 1 ? "catch" : "catches"} · tap to {cardOpen ? "hide" : "view"}</span>
            </div>
          </div>
          <div className="total" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div>
              <b>{myTotal.toLocaleString()}</b>
              <span>points</span>
            </div>
            <Icon name="next" size={18} className={`collapse-chevron ${cardOpen ? "open" : ""}`} />
          </div>
        </button>

        {cardOpen &&
          (mine.length === 0 ? (
            <div className="empty-state" style={{ padding: "28px 12px" }}>
              <div className="empty-icon">
                <Icon name="waves" size={30} />
              </div>
              No fish on your card yet. Get a line in the water.
            </div>
          ) : (
            <div>
              {mine.map((c) => {
                const trashUncounted =
                  c.status === "APPROVED" && isTrash(c.species) && !myScore?.scoredTrashIds.includes(c.id);
                return (
                  <div className={`sc-row ${c.status !== "APPROVED" ? "dim" : ""}`} key={c.id}>
                    <div className="sc-species">
                      {c.species}
                      <small>
                        {c.gearType === "LURE" ? "Artificial lure" : "Bait"}
                        {c.status === "PENDING" ? " · pending M.O.C." : c.status === "REJECTED" ? " · rejected" : ""}
                        {c.isTrophy ? " · Trophy" : ""}
                        {c.isRecordBreaker ? " · Record" : ""}
                        {trashUncounted ? " · not counted (best 3 only)" : ""}
                      </small>
                      {c.status !== "REJECTED" && <small className="sc-calc">{scoreCalc(c)}</small>}
                    </div>
                    <div className="sc-len">{c.lengthInches}"</div>
                    <div className="sc-pts">
                      {c.status !== "APPROVED" ? (
                        "—"
                      ) : trashUncounted ? (
                        <span style={{ textDecoration: "line-through", color: "var(--sand-faint)" }}>
                          +{c.pointValue.toLocaleString()}
                        </span>
                      ) : (
                        `+${c.pointValue.toLocaleString()}`
                      )}
                    </div>
                  </div>
                );
              })}
              {myScore && myScore.penalty > 0 && (
                <div className="sc-row" style={{ color: "var(--danger)" }}>
                  <div className="sc-species">Scoring deficit (M.O.C. penalty)</div>
                  <div className="sc-len" />
                  <div className="sc-pts">−{myScore.penalty.toLocaleString()}</div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
