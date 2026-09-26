export type SeasonBand = {
  label: string;
  /** ISO date (YYYY-MM-DD), inclusive. */
  start: string;
  /** ISO date (YYYY-MM-DD), inclusive. */
  end: string;
  /** Shown once in the legend footnote when true. */
  approximate?: boolean;
};

/**
 * Season bands shown behind the spaces timeline. Ramadan/Eid dates are
 * lunar-calendar estimates, flagged as approximate in the legend footnote.
 */
export const SEASON_BANDS: SeasonBand[] = [
  { label: "Wedding season", start: "2026-10-01", end: "2026-12-31" },
  { label: "Ramadan", start: "2027-02-18", end: "2027-03-19", approximate: true },
  { label: "Eid", start: "2027-03-20", end: "2027-03-22", approximate: true },
];
