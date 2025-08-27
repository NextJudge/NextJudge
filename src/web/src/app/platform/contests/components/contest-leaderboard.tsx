"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ContestProblemStatus } from "@/components/ui/contest-problem-status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { apiGetEventAttempts } from "@/lib/api";
import { Problem, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface ContestLeaderboardProps {
    problems: Problem[];
    participants: User[];
    contestId: number;
    contestStatus: 'upcoming' | 'ongoing' | 'ended';
    isAdmin?: boolean;
}

interface ParticipantProblemStatus {
    userId: string;
    problemId: number;
    status: ContestProblemStatus;
    submissionCount: number;
    lastSubmissionTime?: string;
    isAccepted: boolean;
    attemptsForScore?: number; // attempts counted toward score (<= first AC)
    minutesToSolve?: number; // minutes from contest start to solve
}

interface ParticipantData {
    user: User;
    problemStatuses: Record<number, ParticipantProblemStatus>;
    totalAccepted: number;
    totalSubmissions: number;
    penaltyTimeMinutes: number;
}

export function ContestLeaderboard({
    problems,
    participants,
    contestId,
    contestStatus,
    isAdmin = false
}: ContestLeaderboardProps) {
    const { data: session } = useSession();
    const [participantData, setParticipantData] = useState<ParticipantData[]>([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchLeaderboardData = async () => {
            if (participants.length === 0) return;

            // initialize participant map first so we can always render rows
            const participantMap = new Map<string, ParticipantData>();

            participants.forEach((participant) => {
                const problemStatuses: Record<number, ParticipantProblemStatus> = {};
                problems.forEach((problem) => {
                    problemStatuses[problem.id] = {
                        userId: participant.id,
                        problemId: problem.id,
                        status: contestStatus === 'upcoming' && !isAdmin ? 'NOT_AVAILABLE' :
                            contestStatus === 'upcoming' && isAdmin ? 'ADMIN_PREVIEW' : 'NOT_ATTEMPTED',
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

            // for upcoming contests (non-admin) we skip network call but still show initialized rows
            if ((contestStatus === 'upcoming' && !isAdmin) || !session?.nextjudge_token) {
                setParticipantData(Array.from(participantMap.values()));
                return;
            }

            setLoading(true);
            try {
                const attempts = await apiGetEventAttempts(session.nextjudge_token, contestId);

                attempts.forEach((a) => {
                    const pd = participantMap.get(a.user_id);
                    if (!pd) return;
                    const ps = pd.problemStatuses[a.problem_id];
                    if (!ps) return;

                    ps.submissionCount = a.total_attempts;
                    ps.attemptsForScore = a.attempts;
                    ps.minutesToSolve = a.minutes_to_solve;

                    if (a.first_accepted_time) {
                        ps.isAccepted = true;
                        ps.status = 'ACCEPTED';
                        pd.totalAccepted += 1;
                        // ICPC penalty time: minutes to solve + 20 per wrong attempt before AC
                        const wrongBeforeAC = (ps.attemptsForScore || 1) - 1;
                        const minutesToSolve = a.minutes_to_solve ?? 0;
                        pd.penaltyTimeMinutes += minutesToSolve + 20 * Math.max(0, wrongBeforeAC);
                    }

                    pd.totalSubmissions += a.total_attempts;
                });

                const sorted = Array.from(participantMap.values()).sort((a, b) => {
                    if (a.totalAccepted !== b.totalAccepted) return b.totalAccepted - a.totalAccepted;
                    // tie-breaker by penalty time (lower is better)
                    if (a.penaltyTimeMinutes !== b.penaltyTimeMinutes) return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
                    // final tie-break by total submissions (lower is better)
                    return a.totalSubmissions - b.totalSubmissions;
                });

                setParticipantData(sorted);
            } catch (error) {
                console.error('Failed to fetch leaderboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [session?.nextjudge_token, contestId, contestStatus, participants, problems, isAdmin]);

    const renderProblemCell = (ps: ParticipantProblemStatus) => {
        const isAttempted = ps.submissionCount > 0 && !ps.isAccepted;
        const isUpcoming = ps.status === 'NOT_AVAILABLE';
        const isAdminPreview = ps.status === 'ADMIN_PREVIEW';

        let bgClass = "bg-muted/30 text-muted-foreground border-muted/40";
        let text = "";

        if (isUpcoming) {
            bgClass = "bg-muted/50 text-muted-foreground/60 border-muted/60";
            text = "";
        } else if (isAdminPreview) {
            bgClass = "bg-blue-500/20 text-blue-700 border-blue-300";
            text = "PREVIEW";
        } else if (ps.isAccepted) {
            bgClass = "bg-green-500 text-white border-green-600 shadow-sm";
            // ICPC style: attempts/solveMinutes (e.g., "1/56", "7/278")
            const attemptsToSolve = ps.attemptsForScore && ps.attemptsForScore > 0 ? ps.attemptsForScore : 1;
            const minutes = ps.minutesToSolve ?? 0;
            text = `${attemptsToSolve}/${minutes}`;
        } else if (isAttempted) {
            bgClass = "bg-primary text-primary-foreground border-primary/80 shadow-sm";
            // ICPC style: attempts/-- for unsolved (e.g., "2/--")
            text = `${ps.submissionCount}/--`;
        }

        return (
            <TableCell key={ps.problemId} className="p-1">
                <div
                    className={cn(
                        "w-full h-8 flex items-center justify-center text-[10px] font-bold rounded-md border",
                        bgClass
                    )}
                >
                    {text}
                </div>
            </TableCell>
        );
    };

    const problemHeaderWidthClass = (() => {
        const n = problems.length;
        if (n <= 1) return "w-[520px]"; // single problem: wide
        if (n <= 3) return "w-48";      // few problems: medium
        if (n <= 6) return "w-28";      // several: smaller
        return "w-12";                   // many: compact
    })();

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

    return (
        <Card>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                                        <TableHead key={problem.id} className={cn("text-center font-medium", problemHeaderWidthClass)}>
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
                                                    <img
                                                        src={participant.user.image}
                                                        alt={participant.user.name}
                                                        className="w-6 h-6 rounded-full"
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
                                            {participant.penaltyTimeMinutes}
                                        </TableCell>
                                        {problems.map((problem) => renderProblemCell(participant.problemStatuses[problem.id]))}
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
