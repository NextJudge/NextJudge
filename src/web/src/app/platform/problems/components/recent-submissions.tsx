"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CircleDot } from "lucide-react";
import moment from "moment";
import { RecentSubmission } from "../data/schema";
import { DialogSubmission } from "./dialog-submission";

interface RecentSubmissionCardProps {
  submission: RecentSubmission;
}

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

type SubmissionStatus = "accepted" | "rejected" | "pending";

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const variantStyles = {
    accepted: {
      border:
        "border-green-500 border-opacity-50 dark:border-opacity-25 border-[1px] dark:border-[1px]",
    },
    rejected: {
      border:
        "border-red-500 border-opacity-50 dark:border-opacity-25 border-[1px] dark:border-[1px]",
    },
    pending: {
      border:
        "border-yellow-500 border-opacity-50 dark:border-opacity-25 border-[1px] dark:border-[1px]",
    },
  };

  return (
    <Badge
      variant={`outline`}
      className={`text-xs ${variantStyles[status].border} dark:text-muted-foreground font-medium text-secondary-foreground`}
    >
      {status.split("")[0].toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function RecentSubmissionCard({
  submission,
}: RecentSubmissionCardProps) {
  const submissionStatus: SubmissionStatus =
    submission.status as SubmissionStatus;
  return (
    <>
      <div className="hidden md:block">
        <DialogSubmission submission={submission}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out">
            <CardHeader className="grid grid-cols-[1fr_100px] items-end gap-8 space-y-0">
              <div className="space-y-1">
                <CardTitle>{submission.problem?.title}</CardTitle>
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
                      submission.language && getColorClass(submission.language)
                    )}
                  />
                  {submission.language}
                </div>
                <div>{moment(submission.time).fromNow()}</div>
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
            <CardTitle>{submission.problem?.title}</CardTitle>
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
                  submission.language && getColorClass(submission.language)
                )}
              />
              {submission.language}
            </div>
            <div>{moment(submission.time).fromNow()}</div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
