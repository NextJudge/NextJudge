import type { EventProblemAttemptDTO } from "@/lib/api";
import type { ContestProblemStatus } from "@/components/ui/contest-problem-status-badge";
import type { Problem, User } from "@/lib/types";

export interface ParticipantStanding {
    user: User;
    totalAccepted: number;
    totalSubmissions: number;
    penaltyTimeMinutes: number;
}

export interface ParticipantProblemStatus {
    userId: string;
    problemId: number;
    status: ContestProblemStatus;
    submissionCount: number;
    lastSubmissionTime?: string;
    isAccepted: boolean;
    attemptsForScore?: number;
    minutesToSolve?: number;
}

export interface ParticipantLeaderboardRow {
    user: User;
    problemStatuses: Record<number, ParticipantProblemStatus>;
    totalAccepted: number;
    totalSubmissions: number;
    penaltyTimeMinutes: number;
}

export const hasAnySubmissions = (attempts: EventProblemAttemptDTO[]): boolean =>
    attempts.some((attempt) => attempt.total_attempts > 0);

export const buildParticipantStandings = (
    participants: User[],
    attempts: EventProblemAttemptDTO[],
): ParticipantStanding[] => {
    const participantMap = new Map<string, ParticipantStanding>();

    participants.forEach((participant) => {
        participantMap.set(participant.id, {
            user: participant,
            totalAccepted: 0,
            totalSubmissions: 0,
            penaltyTimeMinutes: 0,
        });
    });

    attempts.forEach((attempt) => {
        const standing = participantMap.get(attempt.user_id);
        if (!standing) return;

        if (attempt.first_accepted_time) {
            standing.totalAccepted += 1;
            const wrongBeforeAC = (attempt.attempts || 1) - 1;
            const minutesToSolve = attempt.minutes_to_solve ?? 0;
            standing.penaltyTimeMinutes += minutesToSolve + 20 * Math.max(0, wrongBeforeAC);
        }

        standing.totalSubmissions += attempt.total_attempts;
    });

    return Array.from(participantMap.values()).sort((a, b) => {
        if (a.totalAccepted !== b.totalAccepted) return b.totalAccepted - a.totalAccepted;
        if (a.penaltyTimeMinutes !== b.penaltyTimeMinutes) return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
        return a.totalSubmissions - b.totalSubmissions;
    });
};

export const buildLeaderboardRows = (
    participants: User[],
    problems: Problem[],
    attempts: EventProblemAttemptDTO[],
    contestStatus: "upcoming" | "ongoing" | "ended",
    isAdmin: boolean,
): ParticipantLeaderboardRow[] => {
    const participantMap = new Map<string, ParticipantLeaderboardRow>();

    participants.forEach((participant) => {
        const problemStatuses: Record<number, ParticipantProblemStatus> = {};

        problems.forEach((problem) => {
            problemStatuses[problem.id] = {
                userId: participant.id,
                problemId: problem.id,
                status:
                    contestStatus === "upcoming" && !isAdmin
                        ? "NOT_AVAILABLE"
                        : contestStatus === "upcoming" && isAdmin
                          ? "ADMIN_PREVIEW"
                          : "NOT_ATTEMPTED",
                submissionCount: 0,
                isAccepted: false,
            };
        });

        participantMap.set(participant.id, {
            user: participant,
            problemStatuses,
            totalAccepted: 0,
            totalSubmissions: 0,
            penaltyTimeMinutes: 0,
        });
    });

    attempts.forEach((attempt) => {
        const row = participantMap.get(attempt.user_id);
        if (!row) return;

        const problemStatus = row.problemStatuses[attempt.problem_id];
        if (!problemStatus) return;

        problemStatus.submissionCount = attempt.total_attempts;
        problemStatus.attemptsForScore = attempt.attempts;
        problemStatus.minutesToSolve = attempt.minutes_to_solve;

        if (attempt.first_accepted_time) {
            problemStatus.isAccepted = true;
            problemStatus.status = "ACCEPTED";
            row.totalAccepted += 1;

            const wrongBeforeAC = (problemStatus.attemptsForScore || 1) - 1;
            const minutesToSolve = attempt.minutes_to_solve ?? 0;
            row.penaltyTimeMinutes += minutesToSolve + 20 * Math.max(0, wrongBeforeAC);
        }

        row.totalSubmissions += attempt.total_attempts;
    });

    return Array.from(participantMap.values()).sort((a, b) => {
        if (a.totalAccepted !== b.totalAccepted) return b.totalAccepted - a.totalAccepted;
        if (a.penaltyTimeMinutes !== b.penaltyTimeMinutes) return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
        return a.totalSubmissions - b.totalSubmissions;
    });
};
