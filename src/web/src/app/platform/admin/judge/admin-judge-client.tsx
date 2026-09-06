"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import {
	apiDrainJudgeQueue,
	apiGetJudgeQueueStats,
	apiGetJudgeWorkers,
	apiRejudgeSubmission,
	JudgeQueueStats,
	JudgeWorker,
} from "@/lib/api";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

const WORKER_STALE_MS = 60_000;

const formatRelativeTime = (isoDate: string): string => {
	const deltaMs = Date.now() - new Date(isoDate).getTime();
	if (deltaMs < 60_000) {
		return "just now";
	}
	const minutes = Math.floor(deltaMs / 60_000);
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.floor(minutes / 60);
	return `${hours}h ago`;
};

const isWorkerHealthy = (worker: JudgeWorker): boolean =>
	Date.now() - new Date(worker.last_seen).getTime() < WORKER_STALE_MS;

export default function AdminJudgeClient() {
	const { data: session } = useSession();
	const { toast } = useToast();
	const [queueStats, setQueueStats] = useState<JudgeQueueStats | null>(null);
	const [workers, setWorkers] = useState<JudgeWorker[]>([]);
	const [loading, setLoading] = useState(true);
	const [draining, setDraining] = useState(false);
	const [rejudgeId, setRejudgeId] = useState("");
	const [rejudging, setRejudging] = useState(false);

	const token = session?.nextjudge_token;

	const refresh = useCallback(async () => {
		if (!token) {
			return;
		}

		try {
			const [stats, workerList] = await Promise.all([
				apiGetJudgeQueueStats(token),
				apiGetJudgeWorkers(token),
			]);
			setQueueStats(stats);
			setWorkers(
				workerList.sort(
					(a, b) =>
						new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime(),
				),
			);
		} catch (error) {
			console.error(error);
			toast({
				title: "Failed to load judge operations",
				description: error instanceof Error ? error.message : undefined,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [token, toast]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleDrain = async () => {
		if (!token) {
			return;
		}

		setDraining(true);
		try {
			const result = await apiDrainJudgeQueue(token);
			await refresh();
			toast({
				title: "Queue drain complete",
				description: `Processed ${result.processed_submissions} submissions and ${result.processed_input_submissions} custom-input runs.`,
			});
		} catch (error) {
			toast({
				title: "Queue drain failed",
				description: error instanceof Error ? error.message : undefined,
				variant: "destructive",
			});
		} finally {
			setDraining(false);
		}
	};

	const handleRejudge = async () => {
		if (!token || !rejudgeId.trim()) {
			return;
		}

		setRejudging(true);
		try {
			const result = await apiRejudgeSubmission(token, rejudgeId.trim());
			setRejudgeId("");
			await refresh();
			toast({
				title: "Submission requeued",
				description: `${result.submission_id} is ${result.status}.`,
			});
		} catch (error) {
			toast({
				title: "Rejudge failed",
				description: error instanceof Error ? error.message : undefined,
				variant: "destructive",
			});
		} finally {
			setRejudging(false);
		}
	};

	if (loading) {
		return (
			<p className="text-sm text-muted-foreground">Loading judge operations...</p>
		);
	}

	return (
		<>
			<Toaster />
			<div className="space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h3 className="text-lg font-medium">Judge operations</h3>
						<p className="text-sm text-muted-foreground">
							Monitor queue depth, worker health, and recover stuck submissions.
						</p>
					</div>
					<Button type="button" variant="outline" onClick={() => refresh()}>
						Refresh
					</Button>
				</div>
				<Separator />

				<div>
					<h4 className="text-base font-medium">Queue stats</h4>
					<p className="text-sm text-muted-foreground">
						RabbitMQ backlog and database enqueue state.
					</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<StatCard
						label="RabbitMQ messages"
						value={queueStats?.rabbitmq_messages ?? 0}
					/>
					<StatCard
						label="Dead-letter queue"
						value={queueStats?.rabbitmq_dlq_messages ?? 0}
					/>
					<StatCard
						label="Pending submissions"
						value={queueStats?.pending_submissions ?? 0}
					/>
					<StatCard
						label="Pending custom input"
						value={queueStats?.pending_input_submissions ?? 0}
					/>
					<StatCard
						label="Failed enqueue (submissions)"
						value={queueStats?.failed_enqueue_submissions ?? 0}
					/>
					<StatCard
						label="Failed enqueue (custom input)"
						value={queueStats?.failed_enqueue_input_submissions ?? 0}
					/>
				</div>
				<Button type="button" onClick={handleDrain} disabled={draining}>
					{draining ? "Draining..." : "Drain enqueue backlog"}
				</Button>

				<Separator />

				<div>
					<h4 className="text-base font-medium">Workers</h4>
					<p className="text-sm text-muted-foreground">
						Live judge workers from heartbeat registry.
					</p>
				</div>
				{workers.length === 0 ? (
					<p className="text-sm text-muted-foreground">No workers reported yet.</p>
				) : (
					<div className="space-y-3">
						{workers.map((worker) => {
							const healthy = isWorkerHealthy(worker);
							return (
								<div
									key={worker.worker_id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
								>
									<div>
										<p className="font-medium">{worker.hostname}</p>
										<p className="text-sm text-muted-foreground">
											{worker.worker_id}
										</p>
									</div>
									<div className="text-right">
										<p
											className={
												healthy
													? "text-sm font-medium text-emerald-600"
													: "text-sm font-medium text-amber-600"
											}
										>
											{healthy ? "Healthy" : "Stale"}
										</p>
										<p className="text-sm text-muted-foreground">
											Last seen {formatRelativeTime(worker.last_seen)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<Separator />

				<div>
					<h4 className="text-base font-medium">Rejudge submission</h4>
					<p className="text-sm text-muted-foreground">
						Reset a submission to pending and enqueue a new run.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<div className="flex-1 space-y-3">
						<Label htmlFor="rejudge-submission-id">Submission ID</Label>
						<Input
							id="rejudge-submission-id"
							value={rejudgeId}
							onChange={(event) => setRejudgeId(event.target.value)}
							placeholder="uuid"
						/>
					</div>
					<Button
						type="button"
						variant="secondary"
						onClick={handleRejudge}
						disabled={rejudging || !rejudgeId.trim()}
					>
						{rejudging ? "Rejudging..." : "Rejudge"}
					</Button>
				</div>
			</div>
		</>
	);
}

type StatCardProps = {
	label: string;
	value: number;
};

const StatCard = ({ label, value }: StatCardProps) => (
	<div className="rounded-md border p-3">
		<p className="text-sm text-muted-foreground">{label}</p>
		<p className="text-2xl font-semibold tabular-nums">{value}</p>
	</div>
);
