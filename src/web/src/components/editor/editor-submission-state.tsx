import { Submission, TestCase, statusMap } from "@/lib/types";
import {
  formatSubmissionMemory,
  formatSubmissionRuntime,
} from "@/components/submissions/submission-meta";
import { cn } from "@/lib/utils";

function getFailedTestCaseNumber(
  submission: Submission,
  publicTestCases: TestCase[]
): number | null {
  if (!submission.failed_test_case_id) {
    return null;
  }

  const index = publicTestCases.findIndex(
    (testCase) => testCase.id === submission.failed_test_case_id
  );

  return index >= 0 ? index + 1 : null;
}

export function SubmissionState({
  submission,
  publicTestCases = [],
}: {
  submission: Submission;
  publicTestCases?: TestCase[];
}) {
  const parsedStatus = statusMap[submission.status];
  const isAccepted = parsedStatus === "Accepted";
  const isPending = parsedStatus === "Pending";
  const memoryLabel = formatSubmissionMemory(submission.memory_used);
  const failedTestCaseNumber = getFailedTestCaseNumber(
    submission,
    publicTestCases
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn("text-lg font-semibold", {
            "text-green-500": isAccepted,
            "text-yellow-500": isPending,
            "text-red-500": !isAccepted && !isPending,
          })}
        >
          {parsedStatus}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Runtime:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatSubmissionRuntime(submission.time_elapsed)}
            </span>
          </span>
          {memoryLabel && (
            <span>
              Memory:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {memoryLabel}
              </span>
            </span>
          )}
        </div>
      </div>

      {failedTestCaseNumber !== null && (
        <p className="text-sm text-destructive">
          Failed on test case {failedTestCaseNumber}
        </p>
      )}

      {submission.status === "COMPILE_TIME_ERROR" && submission.stderr && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-destructive">
            Compilation error
          </p>
          <pre className="overflow-x-auto rounded-md border border-destructive/25 bg-destructive/5 p-3 text-xs">
            <code className="whitespace-pre-wrap break-words font-mono">
              {submission.stderr}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
