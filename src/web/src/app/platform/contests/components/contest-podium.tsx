"use client";

import type { EventProblemAttemptDTO } from "@/lib/api";
import { useEventAttempts } from "@/hooks/queries/use-event-queries";
import type { Problem, User } from "@/lib/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useMemo } from "react";
import {
    buildParticipantStandings,
    hasAnySubmissions,
    type ParticipantStanding,
} from "./contest-standings";

interface ContestPodiumProps {
    problems: Problem[];
    participants: User[];
    contestId: number;
    contestStatus: "upcoming" | "ongoing" | "ended";
    isAdmin?: boolean;
    initialAttempts?: EventProblemAttemptDTO[];
}

const getAvatarUrl = (user: User) => {
    if (user.image && user.image.trim() !== "") {
        return user.image;
    }
    return `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.email ?? user.id}`;
};

const getEmptyStateMessage = (
    contestStatus: "upcoming" | "ongoing" | "ended",
    isAdmin: boolean,
    participantCount: number,
    submissionsExist: boolean,
): { title: string; description?: string } => {
    if (participantCount === 0) {
        return { title: "No participants yet" };
    }

    if (contestStatus === "upcoming" && !isAdmin) {
        return {
            title: "Standings available when contest starts",
            description: "Register now and check back when the contest goes live.",
        };
    }

    if (!submissionsExist) {
        return {
            title: "No submissions yet",
            description:
                contestStatus === "ended"
                    ? "Participants registered, but nobody submitted a solution."
                    : "Be the first to submit a solution.",
        };
    }

    if (contestStatus === "ended") {
        return {
            title: "Standings frozen",
            description: "Final results are shown on the leaderboard below.",
        };
    }

    return { title: "No standings yet" };
};

export function ContestPodium({
    problems: _problems,
    participants,
    contestId,
    contestStatus,
    isAdmin = false,
    initialAttempts,
}: ContestPodiumProps) {
    const { data: session } = useSession();
    const attemptsEnabled =
        participants.length > 0 &&
        (contestStatus !== "upcoming" || isAdmin) &&
        initialAttempts === undefined;

    const { data: fetchedAttempts = [], isLoading: fetchLoading } = useEventAttempts(
        session?.nextjudge_token,
        contestId,
        attemptsEnabled,
    );

    const attempts = initialAttempts ?? fetchedAttempts;
    const loading = initialAttempts === undefined ? fetchLoading : false;

    const topThree = useMemo(
        () => buildParticipantStandings(participants, attempts).slice(0, 3),
        [participants, attempts],
    );

    const submissionsExist = hasAnySubmissions(attempts);
    const canShowPodium =
        topThree.length > 0 &&
        (contestStatus !== "upcoming" || isAdmin) &&
        (submissionsExist || topThree.some((entry) => entry.totalAccepted > 0));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!canShowPodium) {
        const emptyState = getEmptyStateMessage(
            contestStatus,
            isAdmin,
            participants.length,
            submissionsExist,
        );

        return (
            <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
                <p className="text-sm font-medium text-foreground">{emptyState.title}</p>
                {emptyState.description && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">{emptyState.description}</p>
                )}
            </div>
        );
    }

    const maxAccepted = Math.max(...topThree.map((entry) => entry.totalAccepted), 1);
    const getBarHeight = (position: number, accepted: number) => {
        if (maxAccepted === 0) {
            return position === 1 ? 70 : position === 2 ? 55 : 40;
        }
        const baseHeight = position === 1 ? 70 : position === 2 ? 55 : 40;
        const scoreMultiplier = accepted / Math.max(maxAccepted, 1);
        return baseHeight * Math.max(scoreMultiplier, 0.5);
    };

    const podiumData = [
        topThree[1]
            ? { ...topThree[1], position: 2, height: getBarHeight(2, topThree[1].totalAccepted) }
            : null,
        topThree[0]
            ? { ...topThree[0], position: 1, height: getBarHeight(1, topThree[0].totalAccepted) }
            : null,
        topThree[2]
            ? { ...topThree[2], position: 3, height: getBarHeight(3, topThree[2].totalAccepted) }
            : null,
    ].filter(Boolean) as Array<ParticipantStanding & { position: number; height: number }>;

    return (
        <div className="space-y-2">
            {contestStatus === "ended" && (
                <p className="text-xs text-muted-foreground text-center">Final standings</p>
            )}
            <div className="h-[200px] flex items-end justify-center gap-3 px-4">
                {podiumData.map((participant) => (
                    <div
                        key={participant.user.id}
                        className="flex flex-col items-center flex-1 max-w-[110px] h-full"
                    >
                        <div className="flex-1 flex flex-col items-center justify-end mb-2">
                            <div className="relative w-10 h-10 mb-1.5 flex-shrink-0">
                                <Image
                                    src={getAvatarUrl(participant.user)}
                                    alt={participant.user.name}
                                    className="rounded-full border-2 border-osu object-cover"
                                    width={40}
                                    height={40}
                                />
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-osu flex items-center justify-center text-white text-[10px] font-bold border-2 border-background">
                                    {participant.position}
                                </div>
                            </div>
                            <span className="text-[11px] font-medium text-foreground truncate w-full text-center px-1">
                                {participant.user.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {participant.totalSubmissions}/{participant.totalAccepted}
                            </span>
                        </div>
                        <div
                            className="w-full bg-osu rounded-t-md flex items-end justify-center transition-all duration-300 shadow-sm relative"
                            style={{
                                height: `${participant.height}%`,
                                minHeight: "35px",
                                marginBottom: "-25px",
                            }}
                        >
                            <div className="text-white text-xs font-bold mb-1.5">
                                {participant.position === 1 ? (
                                    <h2 className="text-2xl">1</h2>
                                ) : participant.position === 2 ? (
                                    <h2 className="text-2xl">2</h2>
                                ) : (
                                    <h2 className="text-2xl">3</h2>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
