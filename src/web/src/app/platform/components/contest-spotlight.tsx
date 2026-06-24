"use client";

import { ContestCard } from "@/components/contest-card";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { NextJudgeEvent } from "@/lib/types";
import { Trophy } from "lucide-react";
import Link from "next/link";

interface ContestSpotlightProps {
	contest: NextJudgeEvent | null;
}

export function ContestSpotlight({ contest }: ContestSpotlightProps) {
	if (!contest) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Trophy className="h-5 w-5" />
						Contest spotlight
					</CardTitle>
					<CardDescription>No live or upcoming contests right now</CardDescription>
				</CardHeader>
				<CardContent>
					<Link
						href="/platform/contests"
						className="text-sm font-medium text-primary hover:underline"
					>
						Browse all contests
					</Link>
				</CardContent>
			</Card>
		);
	}

	return (
		<section className="h-full">
			<div className="mb-3 flex items-center gap-2">
				<Trophy className="h-5 w-5 text-primary" />
				<h2 className="text-lg font-semibold tracking-tight">Contest spotlight</h2>
			</div>
			<ContestCard contest={contest} variant="default" className="h-full" />
		</section>
	);
}
