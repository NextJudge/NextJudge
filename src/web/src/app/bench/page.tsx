"use client";

import { Loader2, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { toast } from "sonner";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    apiGetLanguages,
    getPublicCustomInputSubmissionStatus,
    postPublicCustomInputSubmission,
} from "@/lib/api";
import { Language, SubmissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STARTER_CODE: Record<string, string> = {
    python: `print("hello world")
`,
    pypy: `print("hello world")
`,
    javascript: `console.log("hello world")
`,
    typescript: `console.log("hello world")
`,
    "c++": `#include <iostream>
using namespace std;

int main() {
    cout << "hello world" << endl;
    return 0;
}
`,
    c: `#include <stdio.h>

int main() {
    printf("hello world\\n");
    return 0;
}
`,
    java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("hello world");
    }
}
`,
    kotlin: `fun main() {
    println("hello world")
}
`,
    rust: `fn main() {
    println!("hello world");
}
`,
    go: `package main

import "fmt"

func main() {
    fmt.Println("hello world")
}
`,
    ruby: `puts "hello world"
`,
    lua: `print("hello world")
`,
    haskell: `main = putStrLn "hello world"
`,
};

interface BenchmarkResult {
    language: string;
    executionTime: number;
    runtime: number;
    overhead: number;
    status: SubmissionStatus | "PENDING" | "ERROR";
}

const CardDecorator = () => (
    <>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2" />
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2" />
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2" />
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2" />
    </>
);

interface FeatureCardProps {
    children: React.ReactNode;
    className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card
        className={cn(
            "group relative rounded-none shadow-zinc-950/5",
            "bg-black/80 text-white border border-osu/60 backdrop-blur",
            "w-full max-w-full overflow-hidden",
            className
        )}
    >
        <CardDecorator />
        {children}
    </Card>
);

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
}

const StatCard = ({ title, value, subtitle }: StatCardProps) => (
    <FeatureCard>
        <CardHeader className="pb-2 pt-4 px-4">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {title}
            </span>
        </CardHeader>
        <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </CardContent>
    </FeatureCard>
);

export default function BenchmarkPage() {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [results, setResults] = useState<BenchmarkResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentBenchmarkingLang, setCurrentBenchmarkingLang] = useState<
        string | null
    >(null);

    useEffect(() => {
        apiGetLanguages().then(setLanguages).catch(console.error);
    }, []);

    const getStarterCode = (language: Language): string => {
        return STARTER_CODE[language.name.toLowerCase()] || `// ${language.name}`;
    };

    const runBenchmark = async () => {
        if (languages.length === 0) {
            toast.error("No languages loaded");
            return;
        }

        setIsRunning(true);
        setResults([]);

        const TEST_INPUT = "";
        const TEST_EXPECTED = "hello world";

        const newResults: BenchmarkResult[] = [];

        for (const lang of languages) {
            setCurrentBenchmarkingLang(lang.name);
            const code = getStarterCode(lang);

            if (!code || code.startsWith("//")) {
                newResults.push({
                    language: lang.name,
                    executionTime: 0,
                    runtime: 0,
                    overhead: 0,
                    status: "ERROR",
                });
                setResults([...newResults]);
                continue;
            }

            const startTime = performance.now();
            try {
                const runId = await postPublicCustomInputSubmission(
                    code,
                    lang.id,
                    TEST_INPUT,
                    { benchmark: true }
                );

                let result = await getPublicCustomInputSubmissionStatus(runId);
                let attempts = 0;
                const maxAttempts = 60;

                while (
                    !result.finished &&
                    result.status === "PENDING" &&
                    attempts < maxAttempts
                ) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    result = await getPublicCustomInputSubmissionStatus(runId);
                    attempts++;
                }

                const endTime = performance.now();
                const executionTime = endTime - startTime;
                // Runtime is returned in seconds, convert to ms
                const runtime = (result.runtime || 0) * 1000;
                const overhead = Math.max(0, executionTime - runtime);

                const status = result.status;
                if (result.status === "ACCEPTED") {
                    if (result.stdout.trim() !== TEST_EXPECTED) {
                        // validation
                    }
                }

                newResults.push({
                    language: lang.name,
                    executionTime: parseFloat(executionTime.toFixed(2)),
                    runtime: parseFloat(runtime.toFixed(2)),
                    overhead: parseFloat(overhead.toFixed(2)),
                    status: status,
                });
            } catch (error) {
                console.error(`Failed to benchmark ${lang.name}:`, error);
                newResults.push({
                    language: lang.name,
                    executionTime: 0,
                    runtime: 0,
                    overhead: 0,
                    status: "ERROR",
                });
            }

            setResults([...newResults]);
        }

        setIsRunning(false);
        setCurrentBenchmarkingLang(null);
        toast.success("Benchmark complete!");
    };

    const stats = useMemo(() => {
        if (results.length === 0) return null;
        const successful = results.filter((r) => r.status === "ACCEPTED");
        if (successful.length === 0) return null;

        const fastest = successful.reduce((prev, curr) =>
            prev.executionTime < curr.executionTime ? prev : curr
        );
        const slowest = successful.reduce((prev, curr) =>
            prev.executionTime > curr.executionTime ? prev : curr
        );
        const totalTime = successful.reduce(
            (acc, curr) => acc + curr.executionTime,
            0
        );
        const average = totalTime / successful.length;

        return {
            fastest,
            slowest,
            average,
            count: results.length,
            successCount: successful.length,
        };
    }, [results]);

    const sortedResults = [...results].sort((a, b) => {
        if (a.status !== "ACCEPTED" && b.status === "ACCEPTED") return 1;
        if (a.status === "ACCEPTED" && b.status !== "ACCEPTED") return -1;
        return a.executionTime - b.executionTime;
    });

    const sortedResultsByRuntime = [...results].sort((a, b) => {
        if (a.status !== "ACCEPTED" && b.status === "ACCEPTED") return 1;
        if (a.status === "ACCEPTED" && b.status !== "ACCEPTED") return -1;
        return a.runtime - b.runtime;
    });

    return (
        <div className="w-full min-h-screen text-white relative bg-black">
            <div className="absolute top-4 left-4 z-50">
                <Link
                    href="/"
                    className={cn(
                        buttonVariants({ variant: "link" }),
                        "text-white text-sm tracking-wide"
                    )}
                >
                    <Icons.arrowLeft className="w-4 h-4" />
                    Home
                </Link>
            </div>
            <main className="flex max-w-screen-2xl mx-auto flex-col items-center overflow-x-hidden relative z-10">
                <div
                    className="fixed inset-0 -z-10"
                    style={{
                        backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,0.7) 0%,
                rgba(0,0,0,0.5) 20%,
                rgba(0,0,0,0.3) 40%,
                rgba(0,0,0,0.2) 60%,
                rgba(0,0,0,0.3) 80%,
                rgba(0,0,0,0.7) 100%
              ),
              url('/hero-background.png')
            `,
                        backgroundSize: "cover",
                        backgroundPosition: "center center",
                        backgroundRepeat: "no-repeat",
                    }}
                />
                <div className="relative w-full">
                    <div className="relative z-10 py-8 md:py-12">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                <div>
                                    <span className="text-osu text-sm font-medium uppercase tracking-wider">
                                        NextJudge
                                    </span>
                                    <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-white">
                                        Sandbox Execution Benchmark
                                    </h1>
                                    <p className="mt-2 text-gray-400 max-w-xl">
                                        At this scale, measured times primarily reflect sandbox and language startup overhead. Runtime differences, in-practice, are minimal.
                                    </p>
                                </div>
                                <Button
                                    onClick={runBenchmark}
                                    disabled={isRunning || languages.length === 0}
                                    size="lg"
                                    className="w-full md:w-auto bg-osu hover:bg-osu/90 text-white border-0"
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing {currentBenchmarkingLang}...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            Start Benchmark
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-8">
                                <StatCard
                                    title="Lowest Latency"
                                    value={stats ? `${stats.fastest.executionTime}ms` : "—"}
                                    subtitle={stats ? stats.fastest.language.toUpperCase() : "No data"}
                                />
                                <StatCard
                                    title="Highest Latency"
                                    value={stats ? `${stats.slowest.executionTime}ms` : "—"}
                                    subtitle={stats ? stats.slowest.language.toUpperCase() : "No data"}
                                />
                                <StatCard
                                    title="Average Latency"
                                    value={stats ? `${stats.average.toFixed(0)}ms` : "—"}
                                    subtitle={`Across ${stats?.successCount ?? 0} languages`}
                                />
                                <StatCard
                                    title="Pass Rate"
                                    value={
                                        stats
                                            ? `${Math.round((stats.successCount / stats.count) * 100)}%`
                                            : "—"
                                    }
                                    subtitle="Languages with successful runs"
                                />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <FeatureCard>
                                    <CardHeader className="pb-0 pt-5 px-5">
                                        <span className="text-sm text-gray-400">
                                            End-to-End Latency (ms)
                                        </span>
                                        <p className="mt-3 text-lg font-semibold text-white">
                                            Startup + Sandbox + Execution time
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {results.length > 0 ? (
                                            <div className="h-[400px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={sortedResults}
                                                        layout="vertical"
                                                        margin={{ top: 5, right: 70, left: 0, bottom: 5 }}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            horizontal={true}
                                                            vertical={false}
                                                            stroke="rgba(255,255,255,0.05)"
                                                        />
                                                        <XAxis
                                                            type="number"
                                                            scale="linear"
                                                            stroke="#666"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="language"
                                                            stroke="#666"
                                                            fontSize={14}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            width={"auto"}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                                            contentStyle={{
                                                                backgroundColor: "rgba(0,0,0,0.9)",
                                                                borderColor: "rgba(220,68,5,0.3)",
                                                                borderRadius: "6px",
                                                            }}
                                                            itemStyle={{ color: "#fff" }}
                                                            labelStyle={{ color: "#999" }}
                                                        />
                                                        <Bar
                                                            dataKey="executionTime"
                                                            name="Total Time (ms)"
                                                            fill="#666"
                                                            radius={[0, 4, 4, 0]}
                                                        >
                                                            <LabelList
                                                                position="right"
                                                                dataKey="executionTime"
                                                                formatter={(value) => {
                                                                    if (typeof value === 'number') {
                                                                        return `${value.toFixed(1)}`;
                                                                    }
                                                                    return String(value ?? '');
                                                                }}
                                                            />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="h-[400px] flex items-center justify-center border border-dashed border-osu/30 rounded-lg bg-black/40">
                                                <p className="text-gray-500">
                                                    Run benchmark to visualize data
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </FeatureCard>

                                <FeatureCard>
                                    <CardHeader className="pb-0 pt-5 px-5">
                                        <span className="text-sm text-gray-400">"Hello World" Runtime (ms)</span>
                                        <p className="mt-3 text-lg font-semibold text-white">
                                            Measured execution time inside the sandbox
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {results.length > 0 ? (
                                            <div className="h-[400px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={sortedResultsByRuntime}
                                                        layout="vertical"
                                                        margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            horizontal={true}
                                                            vertical={false}
                                                            stroke="rgba(255,255,255,0.05)"
                                                        />
                                                        <XAxis
                                                            type="number"
                                                            stroke="#666"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="language"
                                                            stroke="#666"
                                                            fontSize={14}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            width={"auto"}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                                            contentStyle={{
                                                                backgroundColor: "rgba(0,0,0,0.9)",
                                                                borderColor: "rgba(220,68,5,0.3)",
                                                                borderRadius: "6px",
                                                            }}
                                                            itemStyle={{ color: "#fff" }}
                                                            labelStyle={{ color: "#999" }}
                                                        />
                                                        <Bar
                                                            dataKey="runtime"
                                                            name="Execution Time (ms)"
                                                            fill="#dc4405"
                                                            radius={[0, 4, 4, 0]}
                                                        >
                                                            <LabelList
                                                                position="right"
                                                                dataKey="runtime"
                                                                formatter={(value) => {
                                                                    if (typeof value === 'number') {
                                                                        return `${value.toFixed(1)}`;
                                                                    }
                                                                    return String(value ?? '');
                                                                }}
                                                            />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="h-[400px] flex items-center justify-center border border-dashed border-osu/30 rounded-lg bg-black/40">
                                                <p className="text-gray-500">Waiting for results...</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </FeatureCard>
                            </div>

                            <div className="mt-4">
                                <FeatureCard>
                                    <CardHeader className="pb-0 pt-5 px-5">
                                        <span className="text-sm text-gray-400">Results</span>
                                        <p className="mt-3 text-lg font-semibold text-white">
                                            Raw Data
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {results.length > 0 ? (
                                            <div className="rounded-md border border-osu/30 overflow-hidden bg-black/40">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-osu/20 hover:bg-transparent">
                                                            <TableHead className="text-gray-400">
                                                                Language
                                                            </TableHead>
                                                            <TableHead className="text-gray-400">
                                                                End-to-End Latency
                                                            </TableHead>
                                                            <TableHead className="text-gray-400">
                                                                Runtime
                                                            </TableHead>
                                                            <TableHead className="text-right text-gray-400">
                                                                Status
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {sortedResults.map((result) => (
                                                            <TableRow
                                                                key={result.language}
                                                                className="border-osu/10 hover:bg-osu/5"
                                                            >
                                                                <TableCell className="font-medium text-white">
                                                                    {result.language}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {result.status === "ACCEPTED" ? (
                                                                        <span className="font-mono text-gray-300">
                                                                            {result.executionTime.toFixed(1)}ms
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-600">—</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {result.status === "ACCEPTED" ? (
                                                                        <span className="font-mono text-emerald-400">
                                                                            {result.runtime.toFixed(1)}ms
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-600">—</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Badge
                                                                        className={cn(
                                                                            "text-xs font-medium",
                                                                            result.status === "ACCEPTED"
                                                                                ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                                                                                : "bg-red-600/20 text-red-400 border-red-600/30"
                                                                        )}
                                                                        variant="outline"
                                                                    >
                                                                        {result.status}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="h-[400px] flex items-center justify-center border border-dashed border-osu/30 rounded-lg bg-black/40">
                                                <p className="text-gray-500">Waiting for results...</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </FeatureCard>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
