import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// @note reset all users' credits on the 1st of each month at midnight utc
crons.monthly(
  "monthly credit reset",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.credits.resetAllCredits,
);

export default crons;
