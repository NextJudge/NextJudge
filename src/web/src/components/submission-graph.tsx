"use client";

import {
	getHeatMapDateRange,
	submissionsToHeatMapValues,
} from "@/lib/dashboard-utils";
import { Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
import HeatMap from "@uiw/react-heat-map";
import { useMemo } from "react";

interface SubmissionGraphProps {
	submissions: Submission[];
	className?: string;
}

export default function SubmissionGraph({
	submissions,
	className,
}: SubmissionGraphProps) {
	const safeSubmissions = Array.isArray(submissions) ? submissions : [];

	const heatMapValues = useMemo(
		() => submissionsToHeatMapValues(safeSubmissions),
		[safeSubmissions],
	);

	const { startDate, endDate } = useMemo(
		() => getHeatMapDateRange(safeSubmissions),
		[safeSubmissions],
	);

	if (safeSubmissions.length === 0) {
		return (
			<div
				className={cn(
					"rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground",
					className,
				)}
			>
				Submit solutions to see your activity heatmap
			</div>
		);
	}

	return (
		<div className={cn("overflow-x-auto rounded-xl border bg-card p-4", className)}>
			<h3 className="mb-4 text-sm font-medium text-muted-foreground">
				Submission activity
			</h3>
			<HeatMap
				value={heatMapValues}
				monthLabels={[
					"Jan",
					"Feb",
					"Mar",
					"Apr",
					"May",
					"Jun",
					"Jul",
					"Aug",
					"Sep",
					"Oct",
					"Nov",
					"Dec",
				]}
				width="100%"
				startDate={startDate}
				endDate={endDate}
				panelColors={{
					0: "#f4decd",
					2: "#e4b293",
					4: "#d48462",
					10: "#c2533a",
					20: "#ad001d",
					30: "#000",
				}}
			/>
		</div>
	);
}
