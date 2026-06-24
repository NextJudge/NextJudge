"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { VerdictSummary } from "@/lib/dashboard-utils";
import { ArrowRight, CheckCircle2, Clock, FileCode, XCircle } from "lucide-react";
import Link from "next/link";

interface DashboardStatsProps {
	submissionCount: number;
	verdicts: VerdictSummary;
	continueProblemId?: number;
	continueProblemTitle?: string;
}

export function DashboardStats({
	submissionCount,
	verdicts,
	continueProblemId,
	continueProblemTitle,
}: DashboardStatsProps) {
	return (
		<section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader className="pb-2">
					<CardDescription className="flex items-center gap-2">
						<FileCode className="h-4 w-4" />
						Total submissions
					</CardDescription>
					<CardTitle className="text-3xl">{submissionCount}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						All-time submissions on your account
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardDescription>Recent verdicts</CardDescription>
					<CardTitle className="text-base font-medium">
						From your latest activity
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<Badge variant="outline" className="gap-1 border-green-500 text-green-600">
						<CheckCircle2 className="h-3 w-3" />
						AC {verdicts.accepted}
					</Badge>
					<Badge variant="outline" className="gap-1 border-red-500 text-red-600">
						<XCircle className="h-3 w-3" />
						WA {verdicts.wrongAnswer}
					</Badge>
					<Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
						<Clock className="h-3 w-3" />
						TLE {verdicts.timeLimitExceeded}
					</Badge>
				</CardContent>
			</Card>

			<Card className="sm:col-span-2 lg:col-span-1">
				<CardHeader className="pb-2">
					<CardDescription>Continue solving</CardDescription>
					<CardTitle className="truncate text-base font-medium">
						{continueProblemTitle ?? "Pick a problem"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{continueProblemId && continueProblemTitle ? (
						<Link
							href={`/platform/problems/${continueProblemId}`}
							className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
						>
							Open problem
							<ArrowRight className="h-4 w-4" />
						</Link>
					) : (
						<Link
							href="/platform/problems"
							className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
						>
							Browse problems
							<ArrowRight className="h-4 w-4" />
						</Link>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
