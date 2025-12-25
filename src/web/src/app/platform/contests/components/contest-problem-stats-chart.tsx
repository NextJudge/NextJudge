"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGetEventSubmissions } from "@/lib/api";
import type { Problem, Submission } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

interface EventProblemAttemptDTO {
    user_id: string;
    problem_id: number;
    attempts: number;
    total_attempts: number;
    first_accepted_time?: string;
    minutes_to_solve?: number;
}

interface ContestProblemStatsChartProps {
    problems: Problem[];
    contestAttempts: EventProblemAttemptDTO[];
    contestStatus: 'upcoming' | 'ongoing' | 'ended';
    contestId: number;
}

interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        color: string;
        fill: string;
        payload: ChartDataPoint;
    }>;
    label?: string;
}

interface ChartDataPoint {
    name: string;
    problemTitle: string;
    solvedUsers: number;
    attemptingUsers: number;
    successRate: number;
    avgSolveTime: number | null;
    avgAttempts: number;
    totalSubmissions: number;
    avgExecutionTime: number | null;
    mostPopularLanguage: string | null;
    languageDistribution: Record<string, number>;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        return (
            <div className="bg-popover border border-border rounded-lg shadow-xl p-4 text-sm min-w-[220px]">
                <div className="mb-3 border-b border-border/50 pb-2">
                    <p className="font-bold text-base text-foreground mb-0.5">{label} - {data.problemTitle}</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground text-xs">
                            <div className="w-3 h-3 rounded-sm bg-primary" />
                            Solved:
                        </span>
                        <span className="font-mono font-semibold text-foreground text-xs">
                            {data.solvedUsers} / {data.attemptingUsers}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground text-xs">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(24.8 79.79% 63.14%)' }} />
                            Success Rate:
                        </span>
                        <span className="font-mono font-semibold text-foreground text-xs">
                            {data.successRate}%
                        </span>
                    </div>
                    <div className="flex items-center gap-3 justify-between">
                        <span className="text-muted-foreground text-xs">Total Submissions:</span>
                        <span className="font-mono font-semibold text-foreground text-xs">{data.totalSubmissions}</span>
                    </div>
                    {data.mostPopularLanguage && (
                        <div className="flex items-center gap-3 justify-between">
                            <span className="text-muted-foreground text-xs">Most Popular Language:</span>
                            <span className="font-semibold text-foreground text-xs">{data.mostPopularLanguage}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export function ContestProblemStatsChart({
    problems,
    contestAttempts,
    contestStatus,
    contestId
}: ContestProblemStatsChartProps) {
    const { data: session } = useSession();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!session?.nextjudge_token || contestStatus === 'upcoming') {
                return;
            }

            setLoading(true);
            try {
                const data = await apiGetEventSubmissions(session.nextjudge_token, contestId);
                setSubmissions(data || []);
            } catch (error) {
                console.error('Failed to fetch submissions:', error);
                setSubmissions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [session?.nextjudge_token, contestId, contestStatus]);

    if (contestStatus === 'upcoming' || problems.length === 0) {
        return null;
    }

    const chartData: ChartDataPoint[] = problems.map((problem, index) => {
        const problemAttempts = contestAttempts.filter(
            (attempt) => attempt.problem_id === problem.id
        );

        const problemSubmissions = submissions.filter(
            (sub) => sub.problem_id === problem.id
        );

        const solvedAttempts = problemAttempts.filter(
            (attempt) => attempt.first_accepted_time
        );

        const solvedUsers = solvedAttempts.length;
        const attemptingUsers = problemAttempts.length;

        const totalSubmissions = problemAttempts.reduce(
            (sum, attempt) => sum + attempt.total_attempts,
            0
        );

        const avgAttempts = attemptingUsers > 0
            ? totalSubmissions / attemptingUsers
            : 0;

        const solveTimes = solvedAttempts
            .map(attempt => attempt.minutes_to_solve)
            .filter((time): time is number => time !== undefined && time !== null);

        const avgSolveTime = solveTimes.length > 0
            ? solveTimes.reduce((sum, time) => sum + time, 0) / solveTimes.length
            : null;

        const acceptedSubmissions = problemSubmissions.filter(
            (sub) => sub.status === 'ACCEPTED'
        );

        const executionTimes = acceptedSubmissions
            .map(sub => sub.time_elapsed)
            .filter((time): time is number => time !== undefined && time !== null && time > 0);

        const avgExecutionTime = executionTimes.length > 0
            ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
            : null;

        const languageCounts: Record<string, number> = {};
        problemSubmissions.forEach(sub => {
            if (sub.language?.name) {
                languageCounts[sub.language.name] = (languageCounts[sub.language.name] || 0) + 1;
            }
        });

        const mostPopularLanguage = Object.entries(languageCounts).length > 0
            ? Object.entries(languageCounts).sort(([, a], [, b]) => b - a)[0][0]
            : null;

        const successRate = attemptingUsers > 0
            ? (solvedUsers / attemptingUsers) * 100
            : 0;

        return {
            name: String.fromCharCode(65 + index),
            problemTitle: problem.title,
            solvedUsers,
            attemptingUsers,
            successRate: Math.round(successRate * 10) / 10,
            avgSolveTime,
            avgAttempts: Math.round(avgAttempts * 10) / 10,
            totalSubmissions,
            avgExecutionTime,
            mostPopularLanguage,
            languageDistribution: languageCounts
        };
    });

    if (chartData.length === 0 || chartData.every(d => d.attemptingUsers === 0)) {
        return null;
    }

    const maxUsers = Math.max(...chartData.map(d => d.attemptingUsers), 1);
    const maxExecutionTime = Math.max(
        ...chartData.map(d => d.avgExecutionTime || 0).filter(t => t > 0),
        1
    );

    return (
        <Card className="mt-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Problem Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {loading ? (
                    <div className="h-[320px] w-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                                barGap={-15}
                            >
                                <defs>
                                    <linearGradient id="gradientSolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                                    </linearGradient>
                                    <linearGradient id="gradientAttempted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25}/>
                                        <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.08}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="hsl(var(--muted-foreground) / 0.15)"
                                />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                                    dy={8}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    width={40}
                                    domain={[0, Math.ceil(maxUsers * 1.1)]}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 100]}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    width={40}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'hsl(var(--muted) / 0.08)' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{
                                        paddingBottom: '24px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                    }}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="attemptingUsers"
                                    name="Attempted"
                                    fill="url(#gradientAttempted)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={50}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="solvedUsers"
                                    name="Solved"
                                    fill="url(#gradientSolved)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={50}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="successRate"
                                    name="Success Rate"
                                    stroke="hsl(24.8 79.79% 63.14%)"
                                    strokeWidth={2.5}
                                    dot={{
                                        fill: 'hsl(var(--background))',
                                        stroke: 'hsl(24.8 79.79% 63.14%)',
                                        strokeWidth: 2.5,
                                        r: 4.5
                                    }}
                                    activeDot={{
                                        r: 7,
                                        fill: 'hsl(24.8 79.79% 63.14%)',
                                        stroke: 'hsl(var(--background))',
                                        strokeWidth: 2
                                    }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
