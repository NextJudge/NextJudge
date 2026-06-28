"use client";

import { DummyCodeEditor } from "@/components/landing/bento";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-config";
import { SubmissionMeta } from "@/components/submissions/submission-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Submission, SubmissionStatus, statusMap } from "@/lib/types";
import { cn, convertToMonacoLanguageName } from "@/lib/utils";
import { format } from "date-fns";
import { CircleDot, Copy } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

const languageColors: Record<string, string> = {
  python: "text-python fill-python",
  javascript: "text-javascript fill-javascript",
  java: "text-java fill-java",
  c: "text-c fill-c",
  "c++": "text-c++ fill-c++",
  "c#": "text-c# fill-c#",
  go: "text-go fill-go",
  kotlin: "text-kotlin fill-kotlin",
  ruby: "text-ruby fill-ruby",
  rust: "text-rust fill-rust",
  swift: "text-swift fill-swift",
  typescript: "text-typescript fill-typescript",
};

const getColorClass = (language: string) => {
  return languageColors[language.toLowerCase()];
};

const getStatusColor = (status: SubmissionStatus) => {
  if (status === "ACCEPTED") return "text-green-500";
  if (
    status === "WRONG_ANSWER" ||
    status === "TIME_LIMIT_EXCEEDED" ||
    status === "MEMORY_LIMIT_EXCEEDED" ||
    status === "RUNTIME_ERROR" ||
    status === "COMPILE_TIME_ERROR"
  ) {
    return "text-red-500";
  }
  if (status === "PENDING") return "text-yellow-500";
  return "text-primary-foreground";
};

const handleCopyCode = async (sourceCode: string) => {
  try {
    await navigator.clipboard.writeText(sourceCode);
    toast.success("Code copied to clipboard.");
  } catch {
    toast.error("Could not copy code to clipboard.");
  }
};

export function RecentSubmissionCard({
  submission,
  onUseCode,
}: {
  submission: Submission;
  onUseCode?: (code: string, languageId: string) => void;
}) {
  if (!submission) return null;

  const submissionStatus = submission.status;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out">
          <CardHeader className="grid grid-cols-[1fr_100px] items-end gap-8 space-y-0">
            <div className="space-y-1">
              <CardTitle>{submission.problem?.title ?? "Unknown problem"}</CardTitle>
            </div>
            <div className="flex items-center justify-end space-x-1">
              <SubmissionStatusBadge status={submissionStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CircleDot
                  className={cn(
                    "mr-2 size-2",
                    submission.language?.name && getColorClass(submission.language.name)
                  )}
                />
                {submission.language?.name ?? "Unknown language"}
              </div>
              <div>{moment(submission.submit_time).fromNow()}</div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="min-w-2xl max-w-3xl">
        <DialogHeader>
          <DialogTitle>Submission to {submission.problem?.title ?? "Unknown problem"}</DialogTitle>
          <DialogDescription>
            Submitted by {submission.user?.name || submission.user?.account_identifier || "Unknown"} on{" "}
            {format(submission.submit_time, "PPP 'at' p")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <h2 className={cn("text-lg font-bold", getStatusColor(submissionStatus))}>
            {statusMap[submission.status] || submission.status}
          </h2>
          <SubmissionMeta submission={submission} />
        </div>
        <DummyCodeEditor
          sourceCode={submission.source_code}
          language={convertToMonacoLanguageName(submission.language ?? undefined)}
          readOnly={true}
        />
        <DialogFooter className="gap-2 sm:justify-start">
          {onUseCode ? (
            <Button
              type="button"
              onClick={() => onUseCode(submission.source_code, submission.language_id)}
            >
              Use this code
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => void handleCopyCode(submission.source_code)}
            >
              <Copy className="h-4 w-4" />
              Copy code
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
