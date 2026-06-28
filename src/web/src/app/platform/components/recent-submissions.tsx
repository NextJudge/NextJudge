"use client";

import { DummyCodeEditor } from "@/components/landing/bento";
import {
  SubmissionStatusBadge,
  submissionStatusConfig,
} from "@/components/submissions/submission-status-config";
import { SubmissionMeta } from "@/components/submissions/submission-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Submission, SubmissionStatus } from "@/lib/types";
import { cn, convertToMonacoLanguageName } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface RecentSubmissionsProps {
  submissions: Submission[];
  sectionId?: string;
  viewAllHref?: string;
}

const handleCopyCode = async (sourceCode: string) => {
  try {
    await navigator.clipboard.writeText(sourceCode);
    toast.success("Code copied to clipboard.");
  } catch {
    toast.error("Could not copy code to clipboard.");
  }
};

export function RecentSubmissions({
  submissions,
  sectionId = "submissions",
  viewAllHref = "/platform/problems#submissions",
}: RecentSubmissionsProps) {
  const router = useRouter();
  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const handleRowClick = (submission: Submission, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubmission(submission);
  };

  const handleProblemClick = (submission: Submission) => {
    router.push(`/platform/problems/${submission.problem_id}`);
  };

  return (
    <section
      id={sectionId}
      className="mb-12 scroll-mt-24"
      aria-labelledby="recent-submissions-heading"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 id="recent-submissions-heading" className="text-2xl font-semibold tracking-tight">Recent Submissions</h2>
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push(viewAllHref)}
          aria-label="View all submissions"
        >
          View All
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="rounded-md border">
        {safeSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-2">No submissions yet</div>
            <div className="text-sm text-muted-foreground">
              Start solving problems to see your submissions here
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeSubmissions.map((submission) => {
                return (
                  <TableRow
                    key={submission.id}
                    className="cursor-pointer"
                    onClick={(e) => handleRowClick(submission, e)}
                  >
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProblemClick(submission);
                      }}
                    >
                      <span className="font-medium text-sm">
                        {submission.problem?.title ?? "Unknown problem"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SubmissionStatusBadge
                        status={submission.status}
                        showIcon
                        variant="detailed"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {submission.language?.name ?? "Unknown language"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.submit_time), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="min-w-2xl max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Submission to {selectedSubmission.problem?.title ?? "Unknown problem"}
              </DialogTitle>
              <DialogDescription>
                Submitted on {format(selectedSubmission.submit_time, "PPP 'at' p")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <h2
                className={cn("text-lg font-bold", {
                  "text-green-500": selectedSubmission.status === "ACCEPTED",
                  "text-red-500":
                    selectedSubmission.status === "WRONG_ANSWER" ||
                    selectedSubmission.status === "TIME_LIMIT_EXCEEDED" ||
                    selectedSubmission.status === "MEMORY_LIMIT_EXCEEDED" ||
                    selectedSubmission.status === "RUNTIME_ERROR" ||
                    selectedSubmission.status === "COMPILE_TIME_ERROR",
                  "text-yellow-500": selectedSubmission.status === "PENDING",
                })}
              >
                {submissionStatusConfig[
                  selectedSubmission.status as keyof typeof submissionStatusConfig
                ]?.label || selectedSubmission.status}
              </h2>
              <SubmissionMeta submission={selectedSubmission} />
            </div>
            <DummyCodeEditor
              sourceCode={selectedSubmission.source_code}
              language={convertToMonacoLanguageName(selectedSubmission.language ?? undefined)}
              readOnly={true}
            />
            <DialogFooter className="gap-2 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleCopyCode(selectedSubmission.source_code)}
              >
                <Copy className="h-4 w-4" />
                Copy code
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
