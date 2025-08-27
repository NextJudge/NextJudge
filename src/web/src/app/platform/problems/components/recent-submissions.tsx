"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Submission, SubmissionStatus, statusMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CircleDot } from "lucide-react";
import moment from "moment";
import { DialogSubmission } from "./dialog-submission";

const languageColors: { [key: string]: string } = {
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

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const variantStyles = {
    ACCEPTED: {
      border: "border-green-500",
    },
    WRONG_ANSWER: {
      border: "border-red-500",
    },
    TIME_LIMIT_EXCEEDED: {
      border: "border-red-500",
    },
    MEMORY_LIMIT_EXCEEDED: {
      border: "border-red-500",
    },
    RUNTIME_ERROR: {
      border: "border-red-500",
    },
    COMPILE_TIME_ERROR: {
      border: "border-red-500",
    },
    PENDING: {
      border: "border-yellow-500",
    },
  };

  return (
    <Badge
      variant={`outline`}
      className={`text-xs whitespace-nowrap ${variantStyles[status].border} dark:text-muted-foreground font-medium text-secondary-foreground`}
    >
      {statusMap[status] || status}
    </Badge>
  );
}

export function RecentSubmissionCard({
  submission,
}: {
  submission: Submission;
}) {
  const submissionStatus = submission.status as SubmissionStatus;
  return (
    <>
      <div className="hidden md:block">
        <DialogSubmission submission={submission}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out">
            <CardHeader className="grid grid-cols-[1fr_100px] items-end gap-8 space-y-0">
              <div className="space-y-1">
                <CardTitle>{submission.problem.title}</CardTitle>
              </div>
              <div className="flex items-center justify-end space-x-1">
                <SubmissionStatusBadge status={submissionStatus} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <CircleDot
                    className={cn(
                      "mr-2 size-2",
                      submission.language.name &&
                      getColorClass(submission.language.name)
                    )}
                  />
                  {submission.language.name}
                </div>
                <div>{moment(submission.submit_time).fromNow()}</div>
              </div>
            </CardContent>
          </Card>
        </DialogSubmission>
      </div>
      <Card
        className={cn(
          "md:hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out"
        )}
      >
        <CardHeader className="grid grid-cols-[1fr_100px] items-end gap-8 space-y-0">
          <div className="space-y-1">
            <CardTitle>{submission.problem.title}</CardTitle>
          </div>
          <div className="flex items-center justify-end space-x-1">
            <SubmissionStatusBadge status={submissionStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <CircleDot
                className={cn(
                  "mr-2 size-2",
                  submission.language.name &&
                  getColorClass(submission.language.name)
                )}
              />
              {submission.language.name}
            </div>
            <div>{moment(submission.submit_time).fromNow()}</div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
