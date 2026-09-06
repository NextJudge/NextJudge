"use client";

import { DummyCodeEditor } from "@/components/landing/bento";
import { SubmissionState } from "@/components/editor/editor-submission-state";
import {
	SubmissionStatusBadge,
	submissionStatusConfig,
} from "@/components/submissions/submission-status-config";
import { SubmissionMeta } from "@/components/submissions/submission-meta";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Submission } from "@/lib/types";
import { cn, convertToMonacoLanguageName } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Copy, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const handleCopySource = async (sourceCode: string) => {
	try {
		await navigator.clipboard.writeText(sourceCode);
		toast.success("Source code copied to clipboard.");
	} catch {
		toast.error("Could not copy source code to clipboard.");
	}
};

function TestCaseRunsTable({ submission }: { submission: Submission }) {
	const results = submission.test_case_results ?? [];

	if (results.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				{submission.status === "PENDING"
					? "Test results will appear once judging completes."
					: "No per-test results were recorded for this submission."}
			</p>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-16">#</TableHead>
						<TableHead className="w-24">Result</TableHead>
						<TableHead>Output</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{results.map((result, index) => (
						<TableRow key={result.id}>
							<TableCell className="font-medium tabular-nums">
								{index + 1}
							</TableCell>
							<TableCell>
								{result.passed ? (
									<span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
										<Check className="h-3.5 w-3.5" aria-hidden="true" />
										Passed
									</span>
								) : (
									<span className="inline-flex items-center gap-1 text-sm text-destructive">
										<X className="h-3.5 w-3.5" aria-hidden="true" />
										Failed
									</span>
								)}
							</TableCell>
							<TableCell>
								{(result.stdout || result.stderr) ? (
									<pre className="max-h-40 overflow-auto rounded-md bg-muted/40 p-2 text-xs font-mono whitespace-pre-wrap break-words">
										{result.stdout}
										{result.stderr ? `\n${result.stderr}` : ""}
									</pre>
								) : (
									<span className="text-sm text-muted-foreground">—</span>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export function SubmissionDetailView({ submission }: { submission: Submission }) {
	const problemTitle =
		submission.problem?.title ?? `Problem #${submission.problem_id}`;
	const statusLabel =
		submissionStatusConfig[submission.status]?.label ?? submission.status;

	return (
		<div className="max-w-5xl w-full flex-1 space-y-8 p-8 mx-auto">
			<header className="space-y-3">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-2xl font-bold tracking-tight">{problemTitle}</h1>
					<SubmissionStatusBadge
						status={submission.status}
						showIcon
						variant="detailed"
					/>
				</div>
				<p className="text-sm text-muted-foreground">
					Submitted {format(new Date(submission.submit_time), "PPP 'at' p")}
				</p>
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" className="gap-2" asChild>
						<Link href={`/platform/problems/${submission.problem_id}`}>
							<RotateCcw className="h-4 w-4" aria-hidden="true" />
							Resubmit
						</Link>
					</Button>
					<Button
						type="button"
						variant="outline"
						className="gap-2"
						onClick={() => void handleCopySource(submission.source_code)}
					>
						<Copy className="h-4 w-4" aria-hidden="true" />
						Copy source
					</Button>
				</div>
			</header>

			<section className="space-y-3" aria-labelledby="submission-summary-heading">
				<h2 id="submission-summary-heading" className="text-lg font-semibold">
					Summary
				</h2>
				<p
					className={cn("text-lg font-semibold", {
						"text-green-500": submission.status === "ACCEPTED",
						"text-yellow-500": submission.status === "PENDING",
						"text-red-500":
							submission.status !== "ACCEPTED" &&
							submission.status !== "PENDING",
					})}
				>
					{statusLabel}
				</p>
				<SubmissionMeta submission={submission} />
				<SubmissionState submission={submission} />
			</section>

			<section className="space-y-3" aria-labelledby="test-runs-heading">
				<h2 id="test-runs-heading" className="text-lg font-semibold">
					Test runs
				</h2>
				<TestCaseRunsTable submission={submission} />
			</section>

			<section className="space-y-3" aria-labelledby="source-code-heading">
				<h2 id="source-code-heading" className="text-lg font-semibold">
					Source code
				</h2>
				<DummyCodeEditor
					sourceCode={submission.source_code}
					language={convertToMonacoLanguageName(submission.language ?? undefined)}
					readOnly
				/>
			</section>
		</div>
	);
}
