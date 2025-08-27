"use client";

import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { Card, CardContent } from "@/components/ui/card";
import { ContestProblemStatus, ContestProblemStatusBadge } from "@/components/ui/contest-problem-status-badge";
import { ProblemConstraintsBadges } from "@/components/ui/problem-constraints-badges";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { apiGetEventProblemsStats, apiGetUserEventProblemsStatus, EventProblemStats, UserEventProblemStatus } from "@/lib/api";
import { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ContestProblemsTableProps {
    problems: Problem[];
    contestId: number;
    contestStatus: 'upcoming' | 'ongoing' | 'ended';
    isAdmin?: boolean;
}

export function ContestProblemsTable({
    problems,
    contestId,
    contestStatus,
    isAdmin = false
}: ContestProblemsTableProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [problemStats, setProblemStats] = useState<EventProblemStats[]>([]);
    const [userProblemStatus, setUserProblemStatus] = useState<UserEventProblemStatus[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.nextjudge_token || (contestStatus === 'upcoming' && !isAdmin)) return;

            setLoading(true);
            try {
                const [stats, userStatus] = await Promise.all([
                    apiGetEventProblemsStats(session.nextjudge_token, contestId),
                    apiGetUserEventProblemsStatus(session.nextjudge_token, contestId)
                ]);
                setProblemStats(stats || []);
                setUserProblemStatus(userStatus || []);
            } catch (error) {
                console.error('Failed to fetch contest data:', error);
                setProblemStats([]);
                setUserProblemStatus([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session?.nextjudge_token, contestId, contestStatus, isAdmin]);

    const getProblemAcceptanceCount = (problemId: number): number => {
        const stat = problemStats.find(s => s.problem_id === problemId);
        return stat?.accepted_count || 0;
    };

    const getUserProblemStatus = (problemId: number): ContestProblemStatus => {
        if (contestStatus === 'upcoming' && !isAdmin) {
            return 'NOT_AVAILABLE';
        }

        if (contestStatus === 'upcoming' && isAdmin) {
            return 'ADMIN_PREVIEW';
        }

        const userStatus = userProblemStatus?.find(s => s.problem_id === problemId);
        if (userStatus) {
            // Return the actual submission status from the API
            return userStatus.status as ContestProblemStatus;
        }
        return 'NOT_ATTEMPTED';
    };

    const isContestCompleted = (): boolean => {
        if (contestStatus === 'upcoming' || problems.length === 0) return false;

        const acceptedCount = problems.filter(problem =>
            getUserProblemStatus(problem.id) === 'ACCEPTED'
        ).length;

        return acceptedCount === problems.length;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'very easy':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'easy':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'hard':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'very hard':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleProblemClick = (problemId: number) => {
        if (contestStatus === 'upcoming' && !isAdmin) {
            return;
        }

        if (contestStatus === 'ongoing' || (contestStatus === 'upcoming' && isAdmin)) {
            router.push(`/platform/problems/${problemId}?contest=${contestId}`);
        } else {
            router.push(`/platform/problems/${problemId}`);
        }
    };

    if (problems.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-muted-foreground mb-2">No problems in this contest</div>
                    <div className="text-sm text-muted-foreground">
                        Problems will be added by the contest organizer
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {isContestCompleted() && (
                <Card className="relative h-full w-full overflow-hidden">
                    <BorderBeam
                        duration={15}
                        size={150}
                        colorFrom="#16A34A"
                        colorTo="#4ADE80"
                        borderWidth={0.2}
                    />
                    <BorderBeam
                        duration={15}
                        delay={10}
                        size={150}
                        colorFrom="#16A34A"
                        colorTo="#4ADE80"
                        borderWidth={0.2}
                    />
                    <CardContent className="p-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center rounded-full size-10 bg-none border border-green-200/20">
                                <span className="text-green-600 font-bold text-lg">✓</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-800">Contest Completed!</h3>
                                <p className="text-sm text-green-700/80">
                                    You have successfully solved all problems in this contest. Additional submissions will not count towards your score.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-12 text-center font-medium">#</TableHead>
                                <TableHead className="font-medium">Question name</TableHead>
                                <TableHead className="font-medium">Constraints</TableHead>
                                <TableHead className="font-medium">Status</TableHead>
                                <TableHead className="text-right font-medium">Accepted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {problems.map((problem, index) => (
                                <TableRow
                                    key={problem.id}
                                    className={cn(
                                        "transition-colors",
                                        contestStatus === 'upcoming' && !isAdmin
                                            ? "opacity-60 cursor-not-allowed"
                                            : contestStatus === 'upcoming' && isAdmin
                                                ? "cursor-pointer hover:bg-muted/50 border-l-4 border-l-blue-500"
                                                : "cursor-pointer hover:bg-muted/50"
                                    )}
                                    onClick={() => handleProblemClick(problem.id)}
                                >
                                    <TableCell className="text-center font-medium text-muted-foreground">
                                        {String.fromCharCode(65 + index)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <span>{problem.title}</span>
                                            {contestStatus === 'upcoming' && !isAdmin && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Lock className="w-3 h-3" />
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <ProblemConstraintsBadges
                                            executionTimeout={problem.execution_timeout}
                                            memoryLimit={problem.memory_limit}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <ContestProblemStatusBadge
                                            status={getUserProblemStatus(problem.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {loading ? (
                                            <div className="flex justify-end">
                                                <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
                                            </div>
                                        ) : contestStatus === 'upcoming' && !isAdmin ? (
                                            <span className="text-xs">-</span>
                                        ) : (
                                            <span className="text-sm font-medium">
                                                {getProblemAcceptanceCount(problem.id)}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
