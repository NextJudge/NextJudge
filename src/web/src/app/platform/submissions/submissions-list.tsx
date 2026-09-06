"use client";

import {
	SubmissionStatusBadge,
	submissionStatusConfig,
} from "@/components/submissions/submission-status-config";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	SubmissionListFilters,
	useSubmissionsList,
} from "@/hooks/queries/use-submissions-list";
import { useLanguages } from "@/hooks/queries/use-languages";
import { apiGetProblems } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { SubmissionStatus } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const ALL_FILTER_VALUE = "all";

const verdictOptions: { value: SubmissionStatus; label: string }[] = [
	{ value: "ACCEPTED", label: submissionStatusConfig.ACCEPTED.label },
	{ value: "WRONG_ANSWER", label: submissionStatusConfig.WRONG_ANSWER.label },
	{
		value: "TIME_LIMIT_EXCEEDED",
		label: submissionStatusConfig.TIME_LIMIT_EXCEEDED.label,
	},
	{
		value: "MEMORY_LIMIT_EXCEEDED",
		label: submissionStatusConfig.MEMORY_LIMIT_EXCEEDED.label,
	},
	{ value: "RUNTIME_ERROR", label: submissionStatusConfig.RUNTIME_ERROR.label },
	{
		value: "COMPILE_TIME_ERROR",
		label: submissionStatusConfig.COMPILE_TIME_ERROR.label,
	},
	{ value: "PENDING", label: submissionStatusConfig.PENDING.label },
];

export function SubmissionsList({ token }: { token: string }) {
	const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE);
	const [problemFilter, setProblemFilter] = useState<string>(ALL_FILTER_VALUE);
	const [languageFilter, setLanguageFilter] = useState<string>(ALL_FILTER_VALUE);

	const filters = useMemo<SubmissionListFilters>(() => {
		const next: SubmissionListFilters = {};
		if (statusFilter !== ALL_FILTER_VALUE) {
			next.status = statusFilter as SubmissionStatus;
		}
		if (problemFilter !== ALL_FILTER_VALUE) {
			next.problemId = Number(problemFilter);
		}
		if (languageFilter !== ALL_FILTER_VALUE) {
			next.languageId = languageFilter;
		}
		return next;
	}, [statusFilter, problemFilter, languageFilter]);

	const submissionsQuery = useSubmissionsList(token, filters);
	const languagesQuery = useLanguages();
	const problemsQuery = useQuery({
		queryKey: queryKeys.problems(token),
		queryFn: () => apiGetProblems(token),
		staleTime: 60_000,
	});

	const submissions =
		submissionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

	const handleResetFilters = () => {
		setStatusFilter(ALL_FILTER_VALUE);
		setProblemFilter(ALL_FILTER_VALUE);
		setLanguageFilter(ALL_FILTER_VALUE);
	};

	return (
		<div className="max-w-7xl w-full flex-1 flex-col space-y-6 p-8 mx-8 md:flex">
			<header className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
				<p className="text-muted-foreground">
					Browse and filter your submission history across all problems.
				</p>
			</header>

			<div className="flex flex-wrap items-end gap-3">
				<div className="space-y-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						Verdict
					</label>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[200px]" aria-label="Filter by verdict">
							<SelectValue placeholder="All verdicts" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>All verdicts</SelectItem>
							{verdictOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						Problem
					</label>
					<Select value={problemFilter} onValueChange={setProblemFilter}>
						<SelectTrigger className="w-[240px]" aria-label="Filter by problem">
							<SelectValue placeholder="All problems" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>All problems</SelectItem>
							{(problemsQuery.data ?? []).map((problem) => (
								<SelectItem key={problem.id} value={String(problem.id)}>
									{problem.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						Language
					</label>
					<Select value={languageFilter} onValueChange={setLanguageFilter}>
						<SelectTrigger className="w-[200px]" aria-label="Filter by language">
							<SelectValue placeholder="All languages" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>All languages</SelectItem>
							{(languagesQuery.data ?? []).map((language) => (
								<SelectItem key={language.id} value={language.id}>
									{language.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Button type="button" variant="outline" onClick={handleResetFilters}>
					Reset filters
				</Button>
			</div>

			<div className="rounded-md border">
				{submissionsQuery.isLoading ? (
					<div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
						Loading submissions...
					</div>
				) : submissionsQuery.isError ? (
					<div className="py-16 text-center text-destructive">
						Could not load submissions. Please try again.
					</div>
				) : submissions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<p className="text-muted-foreground mb-2">No submissions found</p>
						<p className="text-sm text-muted-foreground">
							Try adjusting your filters or solve a problem to get started.
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Problem</TableHead>
								<TableHead>Verdict</TableHead>
								<TableHead>Language</TableHead>
								<TableHead>Runtime</TableHead>
								<TableHead>Submitted</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{submissions.map((submission) => (
								<TableRow key={submission.id}>
									<TableCell>
										<Link
											href={`/platform/problems/${submission.problem_id}`}
											className="font-medium hover:underline"
										>
											{submission.problem?.title ?? `Problem #${submission.problem_id}`}
										</Link>
									</TableCell>
									<TableCell>
										<Link href={`/platform/submissions/${submission.id}`}>
											<SubmissionStatusBadge
												status={submission.status}
												showIcon
												variant="detailed"
											/>
										</Link>
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className="font-mono text-xs">
											{submission.language?.name ?? "Unknown"}
										</Badge>
									</TableCell>
									<TableCell className="text-sm tabular-nums text-muted-foreground">
										{submission.time_elapsed > 0
											? `${Math.round(submission.time_elapsed * 1000)} ms`
											: "—"}
									</TableCell>
									<TableCell>
										<Link
											href={`/platform/submissions/${submission.id}`}
											className="text-sm text-muted-foreground hover:text-foreground hover:underline"
										>
											{formatDistanceToNow(new Date(submission.submit_time), {
												addSuffix: true,
											})}
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			{submissionsQuery.hasNextPage && (
				<div className="flex justify-center">
					<Button
						type="button"
						variant="outline"
						onClick={() => void submissionsQuery.fetchNextPage()}
						disabled={submissionsQuery.isFetchingNextPage}
					>
						{submissionsQuery.isFetchingNextPage ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							"Load more"
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
