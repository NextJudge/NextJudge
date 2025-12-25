"use client";

import { DummyCodeEditor } from "@/components/landing/bento";
import { SubmissionStatusBadge, submissionStatusConfig } from "@/components/submissions/submission-status-config";
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
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RecentSubmissionsProps {
  submissions: Submission[];
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
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
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Recent Submissions</h2>
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/platform/problems#submissions")}
        >
          View All
          <ArrowRight className="h-4 w-4" />
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
                        {submission.problem.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SubmissionStatusBadge
                        status={submission.status as SubmissionStatus | "PENDING"}
                        showIcon
                        variant="detailed"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {submission.language.name}
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
                Submission to {selectedSubmission.problem.title}
              </DialogTitle>
              <DialogDescription>
                Submitted on {format(selectedSubmission.submit_time, "PPP 'at' p")}
              </DialogDescription>
            </DialogHeader>
            <div>
              <h1
                className={cn("text-lg font-bold", "text-primary-foreground", {
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
                {submissionStatusConfig[selectedSubmission.status as keyof typeof submissionStatusConfig]?.label || selectedSubmission.status}
              </h1>
            </div>
            <DummyCodeEditor
              sourceCode={selectedSubmission.source_code as any}
              language={convertToMonacoLanguageName(selectedSubmission.language)}
              readOnly={true}
            />
            <DialogFooter className="sm:justify-start">
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
