"use client";

import { Submission } from "@/lib/types";
import { RecentSubmissionCard } from "../problems/components/recent-submissions";

export function SubmissionCards({ submissions }: { submissions: Submission[] }) {
    const safeSubmissions = Array.isArray(submissions) ? submissions : [];

    if (safeSubmissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-2">No submissions yet</div>
                <div className="text-sm text-muted-foreground">
                    Start solving problems to see your submissions here
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {safeSubmissions.map((submission: Submission) => (
                <RecentSubmissionCard
                    key={submission.id}
                    submission={submission}
                />
            ))}
        </div>
    );
}
