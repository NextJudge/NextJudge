"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import Link from "next/link";

interface RecommendedProblemProps {
	problem: Problem | null;
}

const formatDifficulty = (difficulty: Problem["difficulty"]) =>
	difficulty.charAt(0) + difficulty.slice(1).toLowerCase();

export function RecommendedProblem({ problem }: RecommendedProblemProps) {
	if (!problem) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Lightbulb className="h-5 w-5" />
						Recommended problem
					</CardTitle>
					<CardDescription>No problems available yet</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Check back once problems are published.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex h-full flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Lightbulb className="h-5 w-5 text-primary" />
					Recommended for you
				</CardTitle>
				<CardDescription>
					Try this next to keep your streak going
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 space-y-3">
				<div>
					<h3 className="font-semibold">{problem.title}</h3>
					<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
						{problem.identifier}
					</p>
				</div>
				<Badge
					variant="outline"
					className={cn({
						"border-red-500":
							problem.difficulty === "VERY HARD" ||
							problem.difficulty === "HARD",
						"border-yellow-500": problem.difficulty === "MEDIUM",
						"border-green-500": problem.difficulty === "EASY",
						"border-blue-500": problem.difficulty === "VERY EASY",
					})}
				>
					{formatDifficulty(problem.difficulty)}
				</Badge>
			</CardContent>
			<CardFooter>
				<Button asChild className="w-full sm:w-auto">
					<Link href={`/platform/problems/${problem.id}`}>Open in editor</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
