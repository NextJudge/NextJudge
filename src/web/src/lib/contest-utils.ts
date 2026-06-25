import { isAfter, isBefore } from "date-fns";

export type ContestStatus = "upcoming" | "ongoing" | "ended";

export function getContestStatus(
  startTime: string | Date,
  endTime: string | Date,
  now: Date = new Date(),
): ContestStatus {
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const end = endTime instanceof Date ? endTime : new Date(endTime);

  if (isBefore(now, start)) return "upcoming";
  if (isAfter(now, end)) return "ended";
  return "ongoing";
}
