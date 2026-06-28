import { formatDistanceToNow, isAfter, isBefore } from "date-fns";

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

export function getContestTimeDisplay(
  status: ContestStatus,
  startTime: Date,
  endTime: Date,
): string {
  switch (status) {
    case "upcoming":
      return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
    case "ongoing":
      return `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`;
    case "ended":
      return `Ended ${formatDistanceToNow(endTime, { addSuffix: true })}`;
  }
}

export function getContestDuration(startTime: Date, endTime: Date): string {
  const duration = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
