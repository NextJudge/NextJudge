import { auth } from "@/app/auth";
import { format, formatDistance, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContestCelebration } from "@/components/contest-celebration";
import { Icons } from "@/components/icons";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { UserAvatar } from "@/components/nav/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { NextJudgeEvent, Problem, User } from "@/lib/types";
import { getBridgeUrl } from "@/lib/utils";
import { ContestLeaderboard } from "../components/contest-leaderboard";
import { ContestPodium } from "../components/contest-podium";
import { ContestProblemStatsChart } from "../components/contest-problem-stats-chart";
import { ContestProblemsTable } from "../components/contest-problems-table";
import { ContestTimer } from "../components/contest-timer";
import { CloneContestDialog } from "./clone-contest-dialog";
import { QuestionsSection } from "./questions-section";

interface UserEventProblemStatus {
    problem_id: number;
    status: string;
    submit_time: string;
}

interface EventProblemAttemptDTO {
    user_id: string;
    problem_id: number;
    attempts: number;
    total_attempts: number;
    first_accepted_time?: string;
    minutes_to_solve?: number;
}

interface ContestDetailPageProps {
    params: Promise<{ id: string }>;
}

/**
 * Fetches all contest data concurrently using Promise.all for better performance
 */
async function fetchContestData(token: string, contestId: number) {
    try {
        const [contestData, problemsData, participantsData, userStatus, attemptsData] = await Promise.all([
            fetch(`${getBridgeUrl()}/v1/public/events/${contestId}`, {
                headers: { 'Authorization': token }
            }),
            fetch(`${getBridgeUrl()}/v1/events/${contestId}/problems`, {
                headers: { 'Authorization': token }
            }),
            fetch(`${getBridgeUrl()}/v1/public/events/${contestId}/participants`, {
                headers: { 'Authorization': token }
            }),
            fetch(`${getBridgeUrl()}/v1/events/${contestId}/user_problem_status`, {
                headers: { 'Authorization': token }
            }),
            fetch(`${getBridgeUrl()}/v1/events/${contestId}/attempts`, {
                headers: { 'Authorization': token }
            })
        ]);

        const [contestJson, problemsJson, participantsJson, userStatusJson, attemptsJson] = await Promise.all([
            contestData.ok ? contestData.json() : null,
            problemsData.ok ? problemsData.json() : [],
            participantsData.ok ? participantsData.json() : [],
            userStatus.ok ? userStatus.json() : [],
            attemptsData.ok ? attemptsData.json() : []
        ]);

        return {
            contest: contestJson as NextJudgeEvent | null,
            problems: problemsJson as Problem[] || [],
            participants: participantsJson as User[] || [],
            userProblemStatus: userStatusJson as UserEventProblemStatus[] || [],
            contestAttempts: attemptsJson as EventProblemAttemptDTO[] || []
        };
    } catch (error) {
        console.error('Failed to fetch contest data:', error);
        throw new Error('Failed to load contest data');
    }
}

export default async function ContestDetailPage({ params }: ContestDetailPageProps) {
    const { id } = await params;
    const session = await auth();
    const contestId = parseInt(id);

    if (!session?.nextjudge_token || !contestId) {
        notFound();
    }

    const { contest, problems, participants, userProblemStatus, contestAttempts } = await fetchContestData(session.nextjudge_token, contestId);

    if (!contest) {
        notFound();
    }

    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);

    const contestStatus = now < startTime ? 'upcoming' :
        now >= startTime && now <= endTime ? 'ongoing' :
            'ended';

    const getRunningTime = () => {
        if (contestStatus === 'upcoming') {
            return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
        }
        if (contestStatus === 'ongoing') {
            return `Began ${formatDistanceToNow(startTime, { addSuffix: true })}`;
        }
        if (contestStatus === 'ended') {
            return `Ended ${formatDistanceToNow(endTime, { addSuffix: true })}`;
        }
        return null;
    };

    /**
     * Checks if the current user has completed all problems in the contest
     */
    const isContestCompleted = (): boolean => {
        if (contestStatus === 'upcoming' || problems.length === 0 || !userProblemStatus) return false;

        const acceptedCount = problems.filter((problem: Problem) =>
            userProblemStatus.find((status: UserEventProblemStatus) => status.problem_id === problem.id)?.status === 'ACCEPTED'
        ).length;

        return acceptedCount === problems.length;
    };

    /**
     * Determines if the current user was the first to complete all problems
     */
    const isFirstToComplete = (): boolean => {
        if (!session?.nextjudge_id || !isContestCompleted() || problems.length === 0 || !contestAttempts) return false;

        const participantCompletionTimes = participants
            .map((participant: User) => {
                const participantAttempts = contestAttempts?.filter(
                    (attempt: EventProblemAttemptDTO) => attempt.user_id === participant.id
                ) || [];

                const solvedProblems = problems.filter((problem: Problem) => {
                    const attempt = participantAttempts.find(
                        (attempt: EventProblemAttemptDTO) => attempt.problem_id === problem.id
                    );
                    return attempt?.first_accepted_time;
                });

                if (solvedProblems.length === problems.length) {
                    const completionTimes = solvedProblems.map((problem: Problem) => {
                        const attempt = participantAttempts.find(
                            (attempt: EventProblemAttemptDTO) => attempt.problem_id === problem.id
                        );
                        if (!attempt?.first_accepted_time) return 0;
                        return new Date(attempt.first_accepted_time).getTime();
                    });

                    return {
                        userId: participant.id,
                        completionTime: Math.max(...completionTimes)
                    };
                }
                return null;
            })
            .filter((item): item is { userId: string; completionTime: number } => item !== null);

        if (participantCompletionTimes.length === 0) return false;

        const earliestCompletion = participantCompletionTimes.reduce((earliest, current) =>
            current.completionTime < earliest.completionTime ? current : earliest
        );

        return earliestCompletion.userId === session.nextjudge_id;
    };

    /**
     * Determines if the current user won the contest based on ICPC scoring rules
     */
    const isWinner = (): boolean => {
        if (!session?.nextjudge_id || contestStatus !== 'ended' || problems.length === 0 || !contestAttempts) return false;

        const participantStandings = participants.map((participant: User) => {
            const participantAttempts = contestAttempts?.filter(
                (attempt: EventProblemAttemptDTO) => attempt.user_id === participant.id
            ) || [];

            let totalAccepted = 0;
            let penaltyTimeMinutes = 0;
            let totalSubmissions = 0;

            problems.forEach((problem: Problem) => {
                const attempt = participantAttempts.find(
                    (attempt: EventProblemAttemptDTO) => attempt.problem_id === problem.id
                );
                if (attempt) {
                    totalSubmissions += attempt.total_attempts;
                    if (attempt.first_accepted_time) {
                        totalAccepted += 1;
                        const wrongBeforeAC = (attempt.attempts || 1) - 1;
                        const minutesToSolve = attempt.minutes_to_solve ?? 0;
                        penaltyTimeMinutes += minutesToSolve + 20 * Math.max(0, wrongBeforeAC);
                    }
                }
            });

            return {
                userId: participant.id,
                totalAccepted,
                penaltyTimeMinutes,
                totalSubmissions
            };
        });

        const sortedStandings = participantStandings.sort((a, b) => {
            if (a.totalAccepted !== b.totalAccepted) return b.totalAccepted - a.totalAccepted;
            if (a.penaltyTimeMinutes !== b.penaltyTimeMinutes) return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
            return a.totalSubmissions - b.totalSubmissions;
        });

        return sortedStandings.length > 0 && sortedStandings[0].userId === session.nextjudge_id;
    };

    return (
        <>
            <ContestCelebration
                contestId={contestId}
                isWinner={isWinner()}
                hasCompletedAllProblems={isContestCompleted()}
                isFirstToComplete={isFirstToComplete()}
                contestStatus={contestStatus}
            />
            <PlatformNavbar session={session || undefined}>
                <UserAvatar session={session || undefined} />
            </PlatformNavbar>
            <div className="container mx-auto px-4 py-8 max-w-8xl">
                <div className="mb-8">
                    <Link href="/platform/contests">
                        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
                            <Icons.arrowLeft className="w-4 h-4" />
                            Back to Contests
                        </Button>
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 space-y-2">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{contest.title}</h1>
                            <p className="text-base text-muted-foreground">{contest.description}</p>
                        </div>
                        <div className="flex flex-col gap-3 ">
                            <ContestTimer
                                startTime={contest.start_time}
                                endTime={contest.end_time}
                                status={contestStatus}
                            />
                            {session?.user?.is_admin && (
                                <CloneContestDialog
                                    contest={contest}
                                    problems={problems}
                                >
                                    <Button className="gap-2 w-full">
                                        <Icons.copy className="w-4 h-4" />
                                        Clone contest
                                    </Button>
                                </CloneContestDialog>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                            <Icons.calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dates</p>
                                <p className="text-sm font-medium truncate">{format(startTime, "MMM d, yyyy")} - {format(endTime, "MMM d, yyyy")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                            <Icons.clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contest Length</p>
                                <p className="text-sm font-medium truncate">{formatDistance(startTime, endTime)}, {problems.length} problems</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                            <Icons.users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Participants</p>
                                <p className="text-sm font-medium">{participants.length}</p>
                            </div>
                        </div>
                        {getRunningTime() && (
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs text-primary font-medium uppercase tracking-wider">Status</p>
                                    <p className="text-sm font-medium truncate">{getRunningTime()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <Separator className="mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:items-stretch">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Problems</h2>
                                    <Badge variant="secondary" className="text-xs">
                                        {problems.length}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ContestProblemsTable
                                    problems={problems}
                                    contestId={contestId}
                                    contestStatus={contestStatus}
                                    isAdmin={session?.user?.is_admin || false}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Podium</h2>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ContestPodium
                                    problems={problems}
                                    participants={participants}
                                    contestId={contestId}
                                    contestStatus={contestStatus}
                                    isAdmin={session?.user?.is_admin || false}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex flex-col">
                        <QuestionsSection
                            eventId={contestId}
                            problems={problems}
                            isAdmin={session?.user?.is_admin || false}
                        />

                        <ContestProblemStatsChart
                            problems={problems}
                            contestAttempts={contestAttempts}
                            contestStatus={contestStatus}
                            contestId={contestId}
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Leaderboard</h2>
                                <Badge variant="secondary" className="text-xs">
                                    {participants.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ContestLeaderboard
                                problems={problems}
                                participants={participants}
                                contestId={contestId}
                                contestStatus={contestStatus}
                                isAdmin={session?.user?.is_admin || false}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
