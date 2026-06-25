"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { EventProblemAttemptDTO } from "@/lib/api";
import { useEventAttempts } from "@/hooks/queries/use-event-queries";
import type { Problem, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useMemo } from "react";
import {
    buildLeaderboardRows,
    hasAnySubmissions,
    type ParticipantLeaderboardRow,
    type ParticipantProblemStatus,
} from "./contest-standings";

interface ContestLeaderboardProps {
    problems: Problem[];
    participants: User[];
    contestId: number;
    contestStatus: "upcoming" | "ongoing" | "ended";
    isAdmin?: boolean;
    initialAttempts?: EventProblemAttemptDTO[];
}

export function ContestLeaderboard({
    problems,
    participants,
    contestId,
    contestStatus,
    isAdmin = false,
    initialAttempts,
}: ContestLeaderboardProps) {
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

    const participantData = useMemo<ParticipantLeaderboardRow[]>(
        () => buildLeaderboardRows(participants, problems, attempts, contestStatus, isAdmin),
        [participants, problems, attempts, contestStatus, isAdmin],
    );

    const formatPenaltyTime = (minutes: number): string => {
        if (minutes === 0) return "0";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const renderProblemCell = (problemStatus: ParticipantProblemStatus) => {
        const isAttempted = problemStatus.submissionCount > 0 && !problemStatus.isAccepted;
        const isUpcoming = problemStatus.status === "NOT_AVAILABLE";
        const isAdminPreview = problemStatus.status === "ADMIN_PREVIEW";

        let bgClass = "bg-muted/30 text-muted-foreground border-muted/40";
        let text = "";

        if (isUpcoming) {
            bgClass = "bg-muted/50 text-muted-foreground/60 border-muted/60";
            text = "";
        } else if (isAdminPreview) {
            bgClass = "bg-blue-500/20 text-blue-700 border-blue-300";
            text = "PREVIEW";
        } else if (problemStatus.isAccepted) {
            bgClass = "bg-green-500 text-white border-green-600 shadow-sm";
            const attemptsToSolve =
                problemStatus.attemptsForScore && problemStatus.attemptsForScore > 0
                    ? problemStatus.attemptsForScore
                    : 1;
            const minutes = problemStatus.minutesToSolve ?? 0;
            text = `${attemptsToSolve}/${minutes}`;
        } else if (isAttempted) {
            bgClass = "bg-primary text-primary-foreground border-primary/80 shadow-sm";
            text = `${problemStatus.submissionCount}/--`;
        }

        return (
            <TableCell key={problemStatus.problemId} className="p-1">
                <div
                    className={cn(
                        "w-full h-8 flex items-center justify-center text-[10px] font-bold rounded-md border",
                        bgClass,
                    )}
                >
                    {text}
                </div>
            </TableCell>
        );
    };

    const problemHeaderWidthClass = (() => {
        const count = problems.length;
        if (count <= 1) return "w-[520px]";
        if (count <= 3) return "w-48";
        if (count <= 6) return "w-28";
        return "w-12";
    })();

    const getLeaderboardEmptyMessage = (): { title: string; description?: string } => {
        if (participants.length === 0) {
            return { title: "No participants in this contest" };
        }

        if (contestStatus === "upcoming" && !isAdmin) {
            return {
                title: "Leaderboard available when contest starts",
            };
        }

        if (!hasAnySubmissions(attempts)) {
            return {
                title: "No submissions yet",
                description:
                    contestStatus === "ended"
                        ? `${participants.length} participant${participants.length === 1 ? "" : "s"} registered, but no solutions were submitted.`
                        : "Participants are registered, but nobody has submitted yet.",
            };
        }

        if (contestStatus === "ended") {
            return {
                title: "Standings frozen",
                description: "Final rankings are shown below.",
            };
        }

        return { title: "No standings yet" };
    };

    if (participants.length === 0) {
        return (
            <Card>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        No participants in this contest
                    </div>
                </CardContent>
            </Card>
        );
    }

    const showEmptyState =
        !loading &&
        participantData.length > 0 &&
        !hasAnySubmissions(attempts) &&
        (contestStatus === "upcoming" ? isAdmin : true);

    return (
        <Card>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : showEmptyState && contestStatus !== "upcoming" ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <p className="text-sm font-medium text-foreground">
                            {getLeaderboardEmptyMessage().title}
                        </p>
                        {getLeaderboardEmptyMessage().description && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                {getLeaderboardEmptyMessage().description}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12 text-center font-medium">#</TableHead>
                                    <TableHead className="font-medium min-w-[220px]">Participant</TableHead>
                                    <TableHead className="text-center font-medium">Solved</TableHead>
                                    <TableHead className="text-center font-medium">Time</TableHead>
                                    {problems.map((problem, index) => (
                                        <TableHead
                                            key={problem.id}
                                            className={cn("text-center font-medium", problemHeaderWidthClass)}
                                        >
                                            <div className="px-1 text-center" title={problem.title}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center font-medium">Total att/solv</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participantData.map((participant, index) => (
                                    <TableRow key={participant.user.id}>
                                        <TableCell className="text-center font-medium text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {participant.user.image && (
                                                    <Image
                                                        src={participant.user.image}
                                                        alt={participant.user.name}
                                                        className="w-6 h-6 rounded-full"
                                                        width={24}
                                                        height={24}
                                                    />
                                                )}
                                                <span>{participant.user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-medium">
                                                {participant.totalAccepted}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {formatPenaltyTime(participant.penaltyTimeMinutes)}
                                        </TableCell>
                                        {problems.map((problem) =>
                                            renderProblemCell(participant.problemStatuses[problem.id]),
                                        )}
                                        <TableCell className="text-center text-muted-foreground">
                                            {participant.totalSubmissions}/{participant.totalAccepted}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
