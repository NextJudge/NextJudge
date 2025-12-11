"use client";

import "@/app/globals.css";

import { RecentSubmissionCard } from "@/app/platform/problems/components/recent-submissions";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditorCollapse } from "@/hooks/useEditorCollapse";
import { useThemesLoader } from "@/hooks/useThemeLoader";
import { apiGetSubmissionsStatus, getCustomInputSubmissionStatus, postCustomInputSubmission, postSolution } from "@/lib/api";
import { CustomInputResult as CustomInputResultType, Language, Problem, Submission, statusMap, TestCase } from "@/lib/types";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "../icons";
import {
  CustomInput,
  CustomInputResult,
  Expected,
  Input as InputCase,
  Output,
} from "../submit-box";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TooltipProvider } from "../ui/tooltip";
import CodeEditor from "./code-editor";
import { SubmissionState } from "./editor-submission-state";

export default function EditorComponent({
  details,
  slot,
  tags,
  testCases,
  recentSubmissions,
  languages,
  contestId,
}: {
  details: Problem;
  tags: string[];
  slot: React.ReactNode;
  testCases: TestCase[];
  recentSubmissions: Submission[];
  languages: Language[];
  contestId?: number;
}) {
  const { data: session } = useSession()
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // separate public and hidden test cases
  const publicTestCases = testCases.filter(tc => !tc.hidden);
  const hiddenTestCases = testCases.filter(tc => tc.hidden);

  // Responsive screen width tracking
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isCollapsed, ref, collapse, expand } = useEditorCollapse();
  const {
    isCollapsed: isCollapsed2,
    ref: ref2,
    collapse: collapse2,
    expand: expand2,
  } = useEditorCollapse();
  const { resolvedTheme } = useTheme();
  const { themes, loading } = useThemesLoader();
  // const { onSelect } = useEditorTheme(resolvedTheme, defaultColorScheme);
  const [input, setInput] = useState("");
  const router = useRouter();
  const [recentSubs, setRecentSubs] = useState(recentSubmissions);
  const [code, setCode] = useState<string>("");

  // Submission button stuff
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>("");
  const [currentSubmissionDetails, setCurrentSubmissionDetails] = useState<Submission | null>(null);

  // Custom input run state
  const [customInputResult, setCustomInputResult] = useState<CustomInputResultType | null>(null);
  const [customInputLoading, setCustomInputLoading] = useState(false);

  // Responsive panel sizes based on screen width
  const getResponsivePanelSizes = () => {
    if (screenWidth < 768) {
      return { leftPanel: 100, rightPanel: 0 }; // Full width on mobile, hide right panel
    } else if (screenWidth < 1024) {
      return { leftPanel: 45, rightPanel: 55 }; // Tablet sizes
    } else if (screenWidth < 1440) {
      return { leftPanel: 35, rightPanel: 65 }; // Desktop
    } else {
      return { leftPanel: 30, rightPanel: 70 }; // Large screens
    }
  };

  const { leftPanel, rightPanel } = getResponsivePanelSizes();

  const handleSubmitCode = async (languageId: string, problemId: number) => {
    if (!languageId) {
      toast.error("Please select a language.");
      return
    }

    setSubmissionLoading(true);
    setSubmissionError("");
    try {
      if (!session) {
        throw "Need to be logged in"
      }
      const data = await postSolution(session.nextjudge_token, code, languageId, problemId, session.nextjudge_id, contestId);
      await fetchSubmissionDetails(data.id)
    }
    catch (error: unknown) {
      toast.error("There was an error submitting your code.");
      setSubmissionError(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const fetchSubmissionDetails = (async (submissionId: string) => {
    try {
      if (!session) {
        throw "Need to be logged in"
      }
      console.log("Submission ID", submissionId)
      let data: Submission = await apiGetSubmissionsStatus(session.nextjudge_token, submissionId)
      while (data.status === "PENDING") {
        console.log("Waiting for submission to complete...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        data = await apiGetSubmissionsStatus(session.nextjudge_token, submissionId)
      }

      // ref2.current?.expand();
      // expand2();
      // const submissions = await apiGetRecentSubmissionsForProblem(details.id);
      // setRecentSubs(submissions);

      setSubmissionLoading(false);
      setCurrentSubmissionDetails(data);

      // Show toast based on final status
      const statusMessage = statusMap[data.status];
      if (data.status === "ACCEPTED") {
        toast.success(`${statusMessage}!`);
      } else {
        toast.error(`${statusMessage}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch submission results.");
    }
  });

  const handleRunCustomInput = async (languageId: string) => {
    if (!languageId) {
      toast.error("Please select a language.");
      return;
    }

    if (!input.trim()) {
      toast.error("Please enter custom input.");
      return;
    }

    setCustomInputLoading(true);
    setCustomInputResult(null);

    try {
      if (!session) {
        throw new Error("Need to be logged in");
      }

      const runId = await postCustomInputSubmission(
        session.nextjudge_token,
        code,
        languageId,
        input
      );

      let result = await getCustomInputSubmissionStatus(session.nextjudge_token, runId);
      while (!result.finished && result.status === "PENDING") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        result = await getCustomInputSubmissionStatus(session.nextjudge_token, runId);
      }

      setCustomInputResult(result);

      if (result.stderr) {
        toast.error("Execution completed with errors");
      } else {
        toast.success("Execution completed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to run custom input.");
    } finally {
      setCustomInputLoading(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "relative w-full bg-background",
        "h-[calc(100vh-3.55rem)] min-h-[600px]",
        "max-w-full overflow-hidden",
        "border border-border rounded-lg shadow-sm",
        screenWidth < 768 ? "flex flex-col" : ""
      )}>
        {screenWidth < 768 ? (
          // Mobile Layout - Stacked vertically
          <>
            <div className="flex-1 overflow-auto bg-card border-b border-border">
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Link href="/platform/problems">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Icons.arrowLeft className="w-4 h-4" />
                      Back to Problems
                    </Button>
                  </Link>
                </div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h1 className="text-lg font-bold break-words flex-1 min-w-0 text-foreground">{details.title}</h1>
                  <Badge variant="secondary" className="text-xs font-medium shrink-0 px-2 py-1">
                    {details.difficulty
                      ? details.difficulty.charAt(0) +
                      details.difficulty.slice(1).toLowerCase()
                      : ""}
                  </Badge>
                </div>
                {tags.length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="text-xs text-muted-foreground shrink-0 font-medium">
                      <span>Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/platform/problems?tag=${tag.toLowerCase()}`
                            )
                          }
                          className={cn(
                            "text-xs font-medium",
                            "bg-muted hover:bg-muted/80",
                            "text-muted-foreground hover:text-foreground",
                            "hover:underline",
                            "hover:cursor-pointer",
                            "transition-colors",
                            "break-all"
                          )}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  {slot}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-card">
              {loading && <EditorSkeleton />}
              {!loading && (
                <CodeEditor
                  languages={languages}
                  themes={themes}
                  problemId={details.id}
                  code={code}
                  setCode={setCode}
                  error={submissionError}
                  submissionLoading={submissionLoading}
                  handleSubmitCode={handleSubmitCode}
                  customInputLoading={customInputLoading}
                  handleRunCustomInput={handleRunCustomInput}
                />
              )}
            </div>
          </>
        ) : (
          // Desktop Layout - Resizable panels
          <ResizablePanelGroup
            direction="horizontal"
            className="w-full h-full"
          >
            {/* Problem Statement Section */}
            <ResizablePanel
              defaultSize={leftPanel}
                className="min-w-0 bg-card overflow-auto"
              ref={ref}
                collapsible
                minSize={20}
                maxSize={60}
              onCollapse={collapse}
            >
              <div className="h-full flex flex-col border-r border-border">
                <div className="p-3 sm:p-4 overflow-auto flex-1">
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <Link href={contestId ? `/platform/contests/${contestId}` : "/platform/problems"}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Icons.arrowLeft className="w-4 h-4" />
                          Back to Problems
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words flex-1 min-w-0 text-foreground">{details.title}</h1>
                      <Badge variant="secondary" className="text-sm font-medium shrink-0 px-3 py-1">
                        {details.difficulty
                          ? details.difficulty.charAt(0) +
                          details.difficulty.slice(1).toLowerCase()
                          : ""}
                      </Badge>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="text-sm text-muted-foreground shrink-0 font-medium">
                          <span>Tags:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/platform/problems?tag=${tag.toLowerCase()}`
                                )
                              }
                              className={cn(
                                "text-xs font-medium",
                                "bg-muted hover:bg-muted/80",
                                "text-muted-foreground hover:text-foreground",
                                "hover:underline",
                                "hover:cursor-pointer",
                                "transition-colors",
                                "break-all"
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 border-t border-border pt-4">
                      {slot}
                    </div>
                  </div>
                </div>
              </div>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className={cn(
                  {
                    "transform translate-x-2 z-50": isCollapsed,
                  },
                  "cursor-col-resize hover:bg-muted/50 transition-colors"
                )}
                onClickCapture={() => {
                  if (isCollapsed) {
                    expand();
                  } else {
                    collapse();
                  }
                }}
              />
            <ResizablePanel
              defaultSize={rightPanel}
                className="min-w-0 bg-background"
              minSize={40}
            >
                <ResizablePanelGroup direction="vertical" className="w-full h-full min-h-0">
                {/*  Code Editor Section */}
                <ResizablePanel
                  defaultSize={75}
                  minSize={30}
                  maxSize={90}
                    className="min-w-0 min-h-0 bg-card border-b border-border overflow-hidden"
                >
                    <div className="h-full w-full">
                    {loading && <EditorSkeleton />}
                    {!loading && (
                      <CodeEditor
                        languages={languages}
                        themes={themes}
                        problemId={details.id}
                        code={code}
                        setCode={setCode}
                        error={submissionError}
                        submissionLoading={submissionLoading}
                        handleSubmitCode={handleSubmitCode}
                          customInputLoading={customInputLoading}
                          handleRunCustomInput={handleRunCustomInput}
                      />
                    )}
                  </div>
                  </ResizablePanel>
                  <ResizableHandle
                    withHandle
                    className={cn(
                      {
                        "transform translate-y-2 z-50": isCollapsed2,
                      },
                      "cursor-row-resize hover:bg-muted/50 transition-colors"
                    )}
                    onClickCapture={() => {
                      if (isCollapsed2) {
                        expand2();
                      } else {
                        collapse2();
                      }
                    }}
                  />
                {/* Submission Section */}
                <ResizablePanel
                    defaultSize={25}
                  minSize={10}
                  maxSize={70}
                  collapsible
                  onCollapse={collapse2}
                  ref={ref2}
                  collapsedSize={0}
                    className="min-w-0 min-h-0 bg-card overflow-auto"
                >
                  <div className="p-4 sm:p-5 lg:p-6 space-y-4 h-full overflow-auto border-t border-border">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="text-sm sm:text-base lg:text-lg font-bold flex-1 min-w-0">
                        {/* TODO: clean this up */}
                        {submissionLoading && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-yellow-500">
                              Pending
                            </span>
                            <Icons.loader className="mr-2 w-6 h-6 animate-spin" />
                          </div>
                        )}
                        {submissionError && (
                          <div className="text-sm text-center">{submissionError}</div>
                        )}
                        {!currentSubmissionDetails &&
                          !submissionLoading &&
                          !submissionError && <span>Submission Details</span>}
                        {currentSubmissionDetails && !submissionLoading && (
                          <SubmissionState submission={currentSubmissionDetails} />
                        )}
                      </div>
                      <div className="flex min-w-0 items-center space-x-2 sm:space-x-4 shrink-0">
                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button
                              variant="outline"
                              className="scale-75 sm:scale-90 flex gap-1 sm:gap-2 text-xs sm:text-sm"
                            >
                              <Icons.eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">View Submissions</span>
                              <span className="sm:hidden">Submissions</span>
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle>Your Submissions</DrawerTitle>
                              <DrawerDescription>
                                See your submissions to both this problem and these
                                tags.
                              </DrawerDescription>
                            </DrawerHeader>

                            <div className="mx-6 flex flex-col gap-4">
                              <Tabs
                                defaultValue="problem"
                                className={cn("w-full max-h-96 overflow-y-scroll")}
                              >
                                <TabsList>
                                  <TabsTrigger value="problem">Problem</TabsTrigger>
                                  <TabsTrigger value="tag">Tag</TabsTrigger>
                                </TabsList>
                                <TabsContent value="problem">
                                  <ul className="grid grid-flow-row grid-cols-3 gap-4">
                                    {Array.isArray(recentSubmissions) && recentSubmissions.map((submission) => (
                                      <RecentSubmissionCard
                                        submission={submission}
                                        key={submission.id}
                                      />
                                    ))}
                                  </ul>
                                </TabsContent>
                                <TabsContent value="category">
                                  <ul className="grid grid-flow-row grid-cols-3 gap-4">
                                    {Array.isArray(recentSubmissions) && recentSubmissions.map((submission) => (
                                      <RecentSubmissionCard
                                        submission={submission}
                                        key={submission.id}
                                      />
                                    ))}
                                  </ul>
                                </TabsContent>
                              </Tabs>
                            </div>
                            <DrawerFooter className={cn("mt-4 w-full")}>
                              <DrawerClose>
                                <Button className="w-full" variant="outline">
                                  Done
                                </Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-2 sm:gap-y-4">
                      <Tabs
                          defaultValue={`case-${Math.max(0, (publicTestCases?.length || 1) - 1)}`}
                        className={cn("w-full")}
                      >
                          <TabsList className="flex-wrap h-auto gap-1 p-1">
                            <TabsTrigger key="custom" value={"case-custom"} className="text-xs sm:text-sm">
                              <span className="hidden sm:inline">Custom Test Case</span>
                              <span className="sm:hidden">Custom</span>
                            </TabsTrigger>
                            {publicTestCases.map((testCase, index) => {
                              // Simple status indicator for tabs
                              const isFailedTestCase = currentSubmissionDetails?.failed_test_case_id === testCase.id;
                              const isBeforeFailedCase = currentSubmissionDetails?.failed_test_case_id &&
                                publicTestCases.findIndex(tc => tc.id === currentSubmissionDetails.failed_test_case_id) > index;

                              let statusIcon = "";
                              if (currentSubmissionDetails) {
                                if (currentSubmissionDetails.status === "ACCEPTED") {
                                  statusIcon = "✓";
                                } else if (isFailedTestCase) {
                                  statusIcon = "✗";
                                } else if (isBeforeFailedCase) {
                                  statusIcon = "✓";
                                }
                              }

                              return (
                                <TabsTrigger key={index} value={`case-${index}`} className="text-xs sm:text-sm">
                                  <span className="hidden sm:inline">Test Case {index + 1}</span>
                                  <span className="sm:hidden">TC {index + 1}</span>
                                  {statusIcon && <span className="ml-1">{statusIcon}</span>}
                                </TabsTrigger>
                              );
                            })}
                            {hiddenTestCases.length > 0 && (
                              <TabsTrigger
                                value="hidden-tests"
                                className="text-xs sm:text-sm gap-1.5 text-muted-foreground"
                              >
                                <Icons.lock className="w-3 h-3" />
                                <span className="hidden sm:inline">Hidden ({hiddenTestCases.length})</span>
                                <span className="sm:hidden">{hiddenTestCases.length}</span>
                              </TabsTrigger>
                            )}
                        </TabsList>
                          {publicTestCases.map((testCase, index) => {
                          // Determine test case status based on submission details
                          const isFailedTestCase = currentSubmissionDetails?.failed_test_case_id === testCase.id;
                            const failedTestCaseIndex = currentSubmissionDetails?.failed_test_case_id
                              ? publicTestCases.findIndex(tc => tc.id === currentSubmissionDetails.failed_test_case_id)
                              : -1;
                            const isBeforeFailedCase = failedTestCaseIndex !== -1 && failedTestCaseIndex > index;

                            // get per-test-case result if available
                            const testCaseResult = currentSubmissionDetails?.test_case_results?.find(
                              (r) => r.test_case_id === testCase.id
                            );

                            let testStatus: "passed" | "failed" | "not-run" | "unknown" = "unknown";
                          if (currentSubmissionDetails) {
                            if (testCaseResult) {
                              testStatus = testCaseResult.passed ? "passed" : "failed";
                            } else if (currentSubmissionDetails.status === "ACCEPTED") {
                              testStatus = "passed";
                            } else if (isFailedTestCase) {
                              testStatus = "failed";
                            } else if (isBeforeFailedCase) {
                              testStatus = "passed";
                            } else {
                              testStatus = "not-run";
                            }
                          }

                            // only use per-test-case output, don't fall back to global stdout
                            const outputToShow = testCaseResult?.stdout ?? null;

                            // show stderr: per-test-case stderr, or global stderr for failed test case or compile errors
                            const isCompileError = currentSubmissionDetails?.status === "COMPILE_TIME_ERROR";
                            const stderrToShow = testCaseResult?.stderr ?? (
                              (isFailedTestCase || isCompileError) ? currentSubmissionDetails?.stderr : null
                            );

                          return (
                            <TabsContent key={index} value={`case-${index}`}>
                              <div className="space-y-4">
                                <InputCase input={testCase.input} />
                                <Expected expected={testCase.expected_output} />

                                {/* Show actual output based on test status */}
                                {currentSubmissionDetails ? (
                                  <div>
                                    {isCompileError ? (
                                      // compile error - show error message prominently
                                      <div className="space-y-2">
                                        <div className="flex text-xs font-medium text-red-500 mb-2">
                                          Compilation Failed
                                        </div>
                                        {stderrToShow && (
                                          <Output output={stderrToShow} />
                                        )}
                                      </div>
                                    ) : (
                                      <>
                                          <div className="flex text-xs font-medium mb-2">
                                            <span className={
                                              testStatus === "passed" ? "text-green-500" :
                                                testStatus === "failed" ? "text-red-500" :
                                                  "text-muted-foreground"
                                            }>
                                              Your Output {
                                                testStatus === "passed" ? "✓ (Passed)" :
                                                  testStatus === "failed" ? "✗ (Failed)" :
                                                    "(Not Run)"
                                              }
                                            </span>
                                          </div>
                                          {outputToShow ? (
                                            <Output output={outputToShow} />
                                          ) : (
                                            <div className="text-sm text-muted-foreground p-2 border rounded">
                                              {testStatus === "not-run"
                                                ? "Test case not executed"
                                                : "No per-test-case output available"}
                                            </div>
                                          )}

                                          {/* Error output for runtime errors */}
                                          {stderrToShow && (
                                            <div className="mt-2">
                                              <div className="flex text-xs font-medium text-red-500 mb-2">
                                                Error Output
                                              </div>
                                              <Output output={stderrToShow} />
                                            </div>
                                          )}
                                        </>
                                    )}
                                  </div>
                                ) : (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground block">
                                        Output
                                      </label>
                                      <div className="text-sm text-muted-foreground p-3 border rounded bg-muted/30">
                                        Submit your solution to see output
                                      </div>
                                    </div>
                                )}
                              </div>
                            </TabsContent>
                          );
                        })}
                        <TabsContent value={"case-custom"}>
                            <div className="space-y-4">
                              <CustomInput input={input} onChange={setInput} />
                              {customInputLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Icons.loader className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Running...</span>
                                </div>
                              ) : (
                                <>
                                  <CustomInputResult result={customInputResult?.stdout ?? ""} />
                                  {customInputResult?.stderr && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-red-500 block">
                                        Error Output
                                      </label>
                                      <Output output={customInputResult.stderr} />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </TabsContent>

                          {hiddenTestCases.length > 0 && (
                            <TabsContent value="hidden-tests">
                              <div className="space-y-3">
                                <div className="grid gap-2">
                                  {hiddenTestCases.map((testCase, index) => {
                                    const testCaseResult = currentSubmissionDetails?.test_case_results?.find(
                                      (r) => r.test_case_id === testCase.id
                                    );

                                    let hiddenStatus: "passed" | "failed" | "unknown" = "unknown";
                                    if (currentSubmissionDetails && testCaseResult) {
                                      hiddenStatus = testCaseResult.passed ? "passed" : "failed";
                                    } else if (currentSubmissionDetails?.status === "ACCEPTED") {
                                      hiddenStatus = "passed";
                                    }

                                    return (
                                      <div
                                        key={testCase.id}
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-lg border",
                                          "bg-muted/30 backdrop-blur-sm",
                                          hiddenStatus === "passed" && "border-green-500/30 bg-green-500/5",
                                          hiddenStatus === "failed" && "border-red-500/30 bg-red-500/5",
                                          hiddenStatus === "unknown" && "border-border"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "w-8 h-8 rounded-md flex items-center justify-center",
                                            "bg-muted/50 text-muted-foreground",
                                            hiddenStatus === "passed" && "bg-green-500/10 text-green-500",
                                            hiddenStatus === "failed" && "bg-red-500/10 text-red-500"
                                          )}>
                                            {hiddenStatus === "passed" ? (
                                              <Icons.check className="w-4 h-4" />
                                            ) : hiddenStatus === "failed" ? (
                                              <Icons.close className="w-4 h-4" />
                                            ) : (
                                              <Icons.lock className="w-3.5 h-3.5" />
                                            )}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground">
                                              Hidden Test {index + 1}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              Input & output hidden
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {hiddenStatus !== "unknown" && (
                                            <span className={cn(
                                              "text-xs font-medium px-2 py-1 rounded-full",
                                              hiddenStatus === "passed" && "bg-green-500/10 text-green-500",
                                              hiddenStatus === "failed" && "bg-red-500/10 text-red-500"
                                            )}>
                                              {hiddenStatus === "passed" ? "Passed" : "Failed"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </TabsContent>
                          )}
                      </Tabs>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </TooltipProvider>
  );
}
