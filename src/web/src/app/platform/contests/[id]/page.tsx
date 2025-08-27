"use client";

import { format, formatDistance, formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ContestCelebration } from "@/components/contest-celebration";
import { Icons } from "@/components/icons";
import PlatformNavbar from "@/components/nav/platform-nav";
import UserAvatar from "@/components/nav/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    apiGetEventAttempts,
    apiGetEventParticipants,
    apiGetEventProblems,
    apiGetEventWithDetails,
    apiGetUserEventProblemsStatus
} from "@/lib/api";
import { NextJudgeEvent, Problem, User } from "@/lib/types";
import { ContestLeaderboard } from "../components/contest-leaderboard";
import { ContestProblemsTable } from "../components/contest-problems-table";
import { ContestTimer } from "../components/contest-timer";
import { CloneContestDialog } from "./clone-contest-dialog";
import { QuestionsSection } from "./questions-section";

export default function ContestDetailPage() {
    const params = useParams();
    const { data: session } = useSession();
    const [contest, setContest] = useState<NextJudgeEvent | null>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [participants, setParticipants] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userProblemStatus, setUserProblemStatus] = useState<any[]>([]);
    const [contestAttempts, setContestAttempts] = useState<any[]>([]);

    const contestId = parseInt(params.id as string);

    const fetchContestData = useCallback(async () => {
        if (!session?.nextjudge_token || !contestId) return;

        try {
            setLoading(true);
            const [contestData, problemsData, participantsData, userStatus, attemptsData] = await Promise.all([
                apiGetEventWithDetails(session.nextjudge_token, contestId),
                apiGetEventProblems(session.nextjudge_token, contestId),
                apiGetEventParticipants(session.nextjudge_token, contestId),
                apiGetUserEventProblemsStatus(session.nextjudge_token, contestId).catch(() => []),
                apiGetEventAttempts(session.nextjudge_token, contestId).catch(() => [])
            ]);

            setContest(contestData);
            setProblems(problemsData);
            setParticipants(participantsData);
            setUserProblemStatus(userStatus || []);
            setContestAttempts(attemptsData || []);
        } catch (error) {
            console.error('Failed to fetch contest data:', error);
            toast.error("Failed to load contest. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [session?.nextjudge_token, contestId]);

    const isContestCompleted = (): boolean => {
        if (contestStatus === 'upcoming' || problems.length === 0) return false;

        const acceptedCount = problems.filter(problem =>
            userProblemStatus?.find(s => s.problem_id === problem.id)?.status === 'ACCEPTED'
        ).length;

        return acceptedCount === problems.length;
    };

    const isFirstToComplete = (): boolean => {
        if (!session?.nextjudge_id || !isContestCompleted() || problems.length === 0) return false;

        // get all participants who completed all problems
        const participantCompletionTimes = participants.map(participant => {
            const participantAttempts = contestAttempts.filter(a => a.user_id === participant.id);

            // only those who solved all problems
            const solvedProblems = problems.filter(problem => {
                const attempt = participantAttempts.find(a => a.problem_id === problem.id);
                return attempt?.first_accepted_time;
            });

            if (solvedProblems.length === problems.length) {
                // find the latest first_accepted_time (when they completed the last problem)
                const completionTimes = solvedProblems.map(problem => {
                    const attempt = participantAttempts.find(a => a.problem_id === problem.id);
                    return new Date(attempt.first_accepted_time).getTime();
                });

                return {
                    userId: participant.id,
                    completionTime: Math.max(...completionTimes)
                };
            }
            return null;
        }).filter((item): item is { userId: string; completionTime: number } => item !== null);

        if (participantCompletionTimes.length === 0) return false;

        // find the earliest completion time
        const earliestCompletion = participantCompletionTimes.reduce((earliest, current) =>
            current?.completionTime < earliest?.completionTime ? current : earliest
        );

        return earliestCompletion.userId === session.nextjudge_id;
    };

    const isWinner = (): boolean => {
        if (!session?.nextjudge_id || contestStatus !== 'ended' || problems.length === 0) return false;

        // calculate leaderboard standings using ICPC scoring
        const participantStandings = participants.map(participant => {
            const participantAttempts = contestAttempts.filter(a => a.user_id === participant.id);

            let totalAccepted = 0;
            let penaltyTimeMinutes = 0;
            let totalSubmissions = 0;

            problems.forEach(problem => {
                const attempt = participantAttempts.find(a => a.problem_id === problem.id);
                if (attempt) {
                    totalSubmissions += attempt.total_attempts;
                    if (attempt.first_accepted_time) {
                        totalAccepted += 1;
                        // ICPC penalty time: minutes to solve + 20 per wrong attempt before AC
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

        // sort by ICPC rules: most problems solved, then lowest penalty time, then fewest submissions
        const sortedStandings = participantStandings.sort((a, b) => {
            if (a.totalAccepted !== b.totalAccepted) return b.totalAccepted - a.totalAccepted;
            if (a.penaltyTimeMinutes !== b.penaltyTimeMinutes) return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
            return a.totalSubmissions - b.totalSubmissions;
        });

        // check if user is in first place
        return sortedStandings.length > 0 && sortedStandings[0].userId === session.nextjudge_id;
    };

    useEffect(() => {
        fetchContestData();
    }, [fetchContestData]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleCloneSuccess = () => {
        fetchContestData();
    };

    if (loading) {
        return (
            <>
                <PlatformNavbar>
                    <UserAvatar session={session || undefined} />
                </PlatformNavbar>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </>
        );
    }

    if (!contest) {
        return (
            <>
                <PlatformNavbar>
                    <UserAvatar session={session || undefined} />
                </PlatformNavbar>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold mb-4">Contest not found</h1>
                    <Link href="/platform/contests">
                        <Button variant="outline">Back to Contests</Button>
                    </Link>
                </div>
            </>
        );
    }

    const now = currentTime;
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);

    const contestStatus = now < startTime ? 'upcoming' :
        now >= startTime && now <= endTime ? 'ongoing' :
            'ended';

    const getRunningTime = () => {
        if (contestStatus === 'ongoing') {
            return `Began ${formatDistanceToNow(startTime, { addSuffix: true })}`;
        }
        return null;
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
            <PlatformNavbar>
                <UserAvatar session={session || undefined} />
            </PlatformNavbar>
            <div className="container mx-auto px-4 py-6 max-w-8xl">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/platform/contests">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <Icons.arrowLeft className="w-4 h-4" />
                                Back to Contests
                            </Button>
                        </Link>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">{contest.title}</h1>
                            <p className="text-muted-foreground mb-4">{contest.description}</p>
                            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Icons.calendar className="w-4 h-4" />
                                    <span>{format(startTime, "MMM d, yyyy 'at' h:mm a")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.clock className="w-4 h-4" />
                                    <span>Duration: {formatDistance(startTime, endTime)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.users className="w-4 h-4" />
                                    <span>{participants.length} participants</span>
                                </div>
                                {getRunningTime() && (
                                    <div className="flex items-center gap-2">
                                        <Icons.clock className="w-4 h-4" />
                                        <span>{getRunningTime()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-4">
                            <ContestTimer
                                startTime={contest.start_time}
                                endTime={contest.end_time}
                                status={contestStatus}
                            />

                            {session?.user?.is_admin && (
                                <CloneContestDialog
                                    contest={contest}
                                    problems={problems}
                                    onCloneSuccess={handleCloneSuccess}
                                >
                                    <Button className="gap-2">
                                        <Icons.copy className="w-4 h-4" />
                                        Clone contest
                                    </Button>
                                </CloneContestDialog>
                            )}
                        </div>
                    </div>
                </div>
                <Separator className="mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6 lg:max-w-[50vw]">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Problems</h2>
                                <Badge variant="secondary">
                                    {problems.length} problem{problems.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>

                            <ContestProblemsTable
                                problems={problems}
                                contestId={contestId}
                                contestStatus={contestStatus}
                                isAdmin={session?.user?.is_admin || false}
                            />
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Leaderboard</h2>
                                <Badge variant="secondary">
                                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>

                            <ContestLeaderboard
                                problems={problems}
                                participants={participants}
                                contestId={contestId}
                                contestStatus={contestStatus}
                                isAdmin={session?.user?.is_admin || false}
                            />
                        </div>
                    </div>
                    <QuestionsSection
                        eventId={contestId}
                        problems={problems}
                        isAdmin={session?.user?.is_admin || false}
                    />
                </div>
            </div>
        </>
    );
}
