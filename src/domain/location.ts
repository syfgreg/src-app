/**
 * Tournament location — drives the weather forecast, marine conditions, and
 * tide predictions. The SRC is fished on the Mid-Atlantic surf
 * (Assateague / Ocean City Inlet, MD). Change these to move the whole app's
 * "beach report" to a different beach.
 */
export interface TournamentLocation {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  /** NOAA CO-OPS tide station id (tidesandcurrents.noaa.gov). */
  noaaStationId: string;
  timezone: string;
}

export const TOURNAMENT_LOCATION: TournamentLocation = {
  name: "Assateague Island",
  region: "Ocean City Inlet, MD",
  latitude: 38.056,
  longitude: -75.216,
  noaaStationId: "8570283", // Ocean City Inlet, MD
  timezone: "America/New_York",
};
