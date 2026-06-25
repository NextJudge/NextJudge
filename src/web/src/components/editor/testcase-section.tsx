"use client";

import { Icons } from "@/components/icons";
import {
  CustomInput,
  CustomInputResult,
  Expected,
  Input as InputCase,
  Output,
} from "@/components/submit-box";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs as CaseTabs,
  TabsContent as CaseTabsContent,
  TabsList as CaseTabsList,
  TabsTrigger as CaseTabsTrigger,
} from "@/components/ui/testcase-tabs";
import type {
  CustomInputResult as CustomInputResultType,
  PracticeRunResult,
  Submission,
  SubmissionStatus,
  TestCase,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SubmissionState } from "./editor-submission-state";
import { OutputComparison } from "./output-diff";

interface TestcaseSectionProps {
  publicTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  input: string;
  setInput: (value: string) => void;
  activeCaseTab: string;
  onActiveCaseTabChange: (tab: string) => void;
  runLoading: boolean;
  runResults: PracticeRunResult | null;
  runningCaseIndex: number | null;
  customInputResult: CustomInputResultType | null;
  submissionLoading: boolean;
  submissionError: string;
  currentSubmissionDetails: Submission | null;
}

type CaseRunStatus = "idle" | "running" | "passed" | "failed" | "skipped";

function shouldShowOutputDiff(
  status: CaseRunStatus,
  stdout?: string,
  stderr?: string,
  compileStderr?: string
): boolean {
  if (status !== "failed") return false;
  if (isExecutionError(stderr, compileStderr)) return false;
  return !(compileStderr && !stdout);
}

function isExecutionError(stderr?: string, compileStderr?: string): boolean {
  return Boolean(stderr?.trim()) || Boolean(compileStderr?.trim());
}

function getCaseRunStatus(
  index: number,
  testCaseId: string,
  runLoading: boolean,
  runningCaseIndex: number | null,
  runResults: PracticeRunResult | null,
  submission: Submission | null,
  publicTestCases: TestCase[]
): CaseRunStatus {
  if (runLoading && runningCaseIndex === index) return "running";

  const runResult = runResults?.test_case_results.find(
    (r) => r.test_case_id === testCaseId
  );
  if (runResult) return runResult.passed ? "passed" : "failed";

  if (runResults?.status === "COMPILE_TIME_ERROR") {
    return index === 0 ? "failed" : "skipped";
  }

  if (runLoading && runningCaseIndex !== null && index > runningCaseIndex) {
    return "idle";
  }

  if (submission && !runResults) {
    const testCaseResult = submission.test_case_results?.find(
      (r) => r.test_case_id === testCaseId
    );
    if (testCaseResult) {
      return testCaseResult.passed ? "passed" : "failed";
    }
    if (submission.status === "ACCEPTED") return "passed";

    const isFailedTestCase = submission.failed_test_case_id === testCaseId;
    if (isFailedTestCase) return "failed";

    const failedTestCaseIndex = submission.failed_test_case_id
      ? publicTestCases.findIndex((tc) => tc.id === submission.failed_test_case_id)
      : -1;
    if (failedTestCaseIndex !== -1 && failedTestCaseIndex > index) {
      return "passed";
    }

    if (submission.status === "COMPILE_TIME_ERROR") {
      return index === 0 ? "failed" : "skipped";
    }

    return "skipped";
  }

  return "idle";
}

function getCaseOutput(
  testCaseId: string,
  index: number,
  runResults: PracticeRunResult | null,
  submission: Submission | null
): {
  stdout?: string;
  stderr?: string;
  compileStderr?: string;
} {
  const runResult = runResults?.test_case_results.find(
    (r) => r.test_case_id === testCaseId
  );
  if (runResult) {
    const isCompileError =
      runResults?.status === "COMPILE_TIME_ERROR" && index === 0;
    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      compileStderr: isCompileError ? runResults.stderr : undefined,
    };
  }

  if (!submission) return {};

  const testCaseResult = submission.test_case_results?.find(
    (r) => r.test_case_id === testCaseId
  );
  const isFailedTestCase = submission.failed_test_case_id === testCaseId;
  const isCompileError = submission.status === "COMPILE_TIME_ERROR";

  return {
    stdout: testCaseResult?.stdout,
    stderr:
      testCaseResult?.stderr ??
      (isFailedTestCase || isCompileError ? submission.stderr : undefined),
    compileStderr:
      isCompileError && index === 0 ? submission.stderr : undefined,
  };
}

function CaseStatusIcon({ status }: { status: CaseRunStatus }) {
  if (status === "running") {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }
  if (status === "passed") {
    return <Check className="h-3 w-3 text-[var(--success-green)]" strokeWidth={2.5} />;
  }
  if (status === "failed") {
    return <X className="h-3 w-3 text-destructive" strokeWidth={2.5} />;
  }
  return null;
}

function CaseRunOutput({
  status,
  expected,
  stdout,
  stderr,
  compileStderr,
  showDiff,
}: {
  status: CaseRunStatus;
  expected?: string;
  stdout?: string;
  stderr?: string;
  compileStderr?: string;
  showDiff: boolean;
}) {
  if (status === "idle" || status === "running" || status === "skipped") {
    return null;
  }

  const isCompileError = status === "failed" && Boolean(compileStderr?.trim());
  const isRuntimeError = status === "failed" && Boolean(stderr?.trim()) && !isCompileError;
  const isExecutionErrorResult = isCompileError || isRuntimeError;
  const isWrongAnswer =
    status === "failed" && !isExecutionErrorResult && expected !== undefined;
  const errorOutput = stderr || (isCompileError ? compileStderr : undefined);

  const failureLabel = isCompileError
    ? "Compilation failed"
    : isRuntimeError
      ? "Runtime error"
      : status === "passed"
        ? "Accepted"
        : "Wrong answer";

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border px-3 py-3",
        status === "passed" && "border-[var(--success-green)]/25 bg-[var(--success-green)]/5",
        status === "failed" && "border-destructive/25 bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-2">
        {status === "passed" ? (
          <Check className="h-3.5 w-3.5 text-[var(--success-green)]" strokeWidth={2.5} />
        ) : (
          <X className="h-3.5 w-3.5 text-destructive" strokeWidth={2.5} />
        )}
        <p
          className={cn(
            "text-xs font-medium",
            status === "passed" && "text-[var(--success-green)]",
            status === "failed" && "text-destructive"
          )}
        >
          {failureLabel}
        </p>
      </div>

      {isExecutionErrorResult && stdout && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Your output</p>
          <Output output={stdout} />
        </div>
      )}

      {isWrongAnswer && showDiff && (
        <OutputComparison expected={expected} actual={stdout ?? ""} />
      )}

      {isWrongAnswer && !showDiff && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Your output</p>
          <Output output={stdout ?? ""} />
        </div>
      )}

      {status === "passed" && stdout && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Your output</p>
          <Output output={stdout} />
        </div>
      )}

      {errorOutput && (
        <div className="space-y-1.5">
          <p className="text-xs text-destructive">Error output</p>
          <Output output={errorOutput} />
        </div>
      )}
    </div>
  );
}

function HiddenTestsNotice({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icons.lock className="h-3.5 w-3.5" />
      <span>{count} hidden</span>
    </div>
  );
}

function formatCustomOutput(result: CustomInputResultType): string {
  if (result.stderr) return result.stderr;
  if (result.stdout) return result.stdout;

  const statusMessages: Partial<Record<SubmissionStatus, string>> = {
    TIME_LIMIT_EXCEEDED: "Time limit exceeded",
    MEMORY_LIMIT_EXCEEDED: "Memory limit exceeded",
    RUNTIME_ERROR: "Runtime error",
    COMPILE_TIME_ERROR: "Compilation error",
    WRONG_ANSWER: "Wrong answer",
  };

  return statusMessages[result.status] ?? "";
}

export function TestcaseSection({
  publicTestCases,
  hiddenTestCases,
  input,
  setInput,
  activeCaseTab,
  onActiveCaseTabChange,
  runLoading,
  runResults,
  runningCaseIndex,
  customInputResult,
  submissionLoading,
  submissionError,
  currentSubmissionDetails,
}: TestcaseSectionProps) {
  const isRunningCustom = runLoading && activeCaseTab === "case-custom";

  const passedCount =
    runResults?.test_case_results.filter((r) => r.passed).length ?? 0;
  const hasRunResults = runResults !== null && !runLoading;
  const showSubmissionResults =
    currentSubmissionDetails !== null && !submissionLoading && !runResults;
  const [showDiff, setShowDiff] = useState(true);

  const hasWrongAnswerOutput = useMemo(
    () =>
      publicTestCases.some((testCase, index) => {
        const status = getCaseRunStatus(
          index,
          testCase.id,
          runLoading,
          runningCaseIndex,
          runResults,
          currentSubmissionDetails,
          publicTestCases
        );
        const { stdout, stderr, compileStderr } = getCaseOutput(
          testCase.id,
          index,
          runResults,
          currentSubmissionDetails
        );
        return shouldShowOutputDiff(status, stdout, stderr, compileStderr);
      }),
    [
      publicTestCases,
      runLoading,
      runningCaseIndex,
      runResults,
      currentSubmissionDetails,
    ]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 h-9 shrink-0 rounded-none bg-muted/40 px-3">
        <span className="text-sm font-medium">Testcase</span>
        {hasRunResults && (
          <span
            data-testid="run-summary"
            className={cn(
              "text-[10px] font-medium tabular-nums",
              runResults.status === "ACCEPTED"
                ? "text-[var(--success-green)]"
                : "text-destructive"
            )}
          >
            {runResults.status === "ACCEPTED" ? "Accepted" : runResults.status}{" "}
            · {passedCount}/{publicTestCases.length}
          </span>
        )}
        {hasWrongAnswerOutput && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              id="show-output-diff"
              checked={showDiff}
              onCheckedChange={(checked) => setShowDiff(checked === true)}
              className="h-3.5 w-3.5"
            />
            Show diff
          </label>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-5 py-4 space-y-4">
          {submissionLoading && (
            <div className="flex items-center gap-2 text-yellow-500">
              <Icons.loader className="w-5 h-5 animate-spin" />
              <span className="font-medium">Pending...</span>
            </div>
          )}

          {submissionError && (
            <p className="text-sm text-destructive">{submissionError}</p>
          )}

          {showSubmissionResults && currentSubmissionDetails && (
            <SubmissionState
              submission={currentSubmissionDetails}
              publicTestCases={publicTestCases}
            />
          )}

          <CaseTabs
            value={activeCaseTab}
            onValueChange={onActiveCaseTabChange}
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <CaseTabsList className="inline-flex h-8 w-auto shrink-0 gap-1 bg-transparent p-0">
                {publicTestCases.map((testCase, index) => {
                  const status = getCaseRunStatus(
                    index,
                    testCase.id,
                    runLoading,
                    runningCaseIndex,
                    runResults,
                    currentSubmissionDetails,
                    publicTestCases
                  );

                  return (
                    <CaseTabsTrigger
                      key={index}
                      value={`case-${index}`}
                      className={cn(
                        "gap-1.5",
                        status === "passed" &&
                          "data-[state=inactive]:border-[var(--success-green)]/40 data-[state=inactive]:text-[var(--success-green)]",
                        status === "failed" &&
                          "data-[state=inactive]:border-destructive/40 data-[state=inactive]:text-destructive"
                      )}
                    >
                      <span>Case {index + 1}</span>
                      <CaseStatusIcon status={status} />
                    </CaseTabsTrigger>
                  );
                })}
                <CaseTabsTrigger value="case-custom" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Custom
                </CaseTabsTrigger>
              </CaseTabsList>
            </div>

            {publicTestCases.map((testCase, index) => {
              const status = getCaseRunStatus(
                index,
                testCase.id,
                runLoading,
                runningCaseIndex,
                runResults,
                currentSubmissionDetails,
                publicTestCases
              );
              const { stdout, stderr, compileStderr } = getCaseOutput(
                testCase.id,
                index,
                runResults,
                currentSubmissionDetails
              );
              const showOutputDiff = shouldShowOutputDiff(
                status,
                stdout,
                stderr,
                compileStderr
              );

              return (
                <CaseTabsContent
                  key={testCase.id}
                  value={`case-${index}`}
                  className="mt-0 space-y-4"
                >
                  <InputCase input={testCase.input} />
                  {!(showOutputDiff && showDiff) && (
                    <Expected expected={testCase.expected_output} />
                  )}
                  {status === "running" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Running...
                    </div>
                  )}
                  <CaseRunOutput
                    status={status}
                    expected={testCase.expected_output}
                    stdout={stdout}
                    stderr={stderr}
                    compileStderr={compileStderr}
                    showDiff={showDiff}
                  />
                </CaseTabsContent>
              );
            })}

            <CaseTabsContent value="case-custom" className="mt-0 space-y-4">
              <CustomInput input={input} onChange={setInput} />
              {isRunningCustom && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </div>
              )}
              {customInputResult && !isRunningCustom && (
                <CustomInputResult result={formatCustomOutput(customInputResult)} />
              )}
            </CaseTabsContent>
          </CaseTabs>

          <HiddenTestsNotice count={hiddenTestCases.length} />
        </div>
      </ScrollArea>
    </div>
  );
}
