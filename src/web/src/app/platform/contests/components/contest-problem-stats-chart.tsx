"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Problem } from "@/lib/types";
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
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-semibold mb-2 text-foreground">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color || entry.fill }}
                                />
                                {entry.name}:
                            </span>
                            <span className="font-mono font-medium text-foreground text-xs">
                                {entry.name === 'Acceptance Rate' ? `${entry.value}%` : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export function ContestProblemStatsChart({
    problems,
    contestAttempts,
    contestStatus
}: ContestProblemStatsChartProps) {
    if (contestStatus === 'upcoming' || problems.length === 0) {
        return null;
    }

    const chartData = problems.map((problem) => {
        const problemAttempts = contestAttempts.filter(
            (attempt) => attempt.problem_id === problem.id
        );

        const solvedCount = problemAttempts.filter(
            (attempt) => attempt.first_accepted_time
        ).length;

        const totalAttempts = problemAttempts.reduce(
            (sum, attempt) => sum + attempt.total_attempts,
            0
        );

        const acceptanceRate = problemAttempts.length > 0
            ? (solvedCount / problemAttempts.length) * 100
            : 0;

        return {
            name: problem.identifier || `P${problem.id}`,
            Solved: solvedCount,
            Attempts: totalAttempts,
            "Acceptance Rate": Math.round(acceptanceRate * 10) / 10
        };
    });

    if (chartData.length === 0) {
        return null;
    }

    return (
        <Card className="mt-4">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Problem Engagement
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                className="stroke-muted/20"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                className="text-[9px] fill-muted-foreground"
                                dy={6}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                className="text-[10px] fill-muted-foreground"
                                width={35}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                hide
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.1)' }} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                iconSize={6}
                                wrapperStyle={{
                                    paddingBottom: '12px',
                                    fontSize: '10px',
                                    fontWeight: 500,
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="Attempts"
                                fill="hsl(var(--muted-foreground))"
                                fillOpacity={0.15}
                                radius={[3, 3, 0, 0]}
                                maxBarSize={40}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="Solved"
                                fill="url(#colorSolved)"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={40}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="Acceptance Rate"
                                stroke="hsl(var(--ring))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--ring))', r: 2.5 }}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
