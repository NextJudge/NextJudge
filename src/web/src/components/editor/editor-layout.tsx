"use client";

import "@/app/globals.css";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RecentSubmissionCard } from "@/app/platform/problems/components/recent-submissions";
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
import { useEditorCollapse } from "@/hooks/useEditorCollapse";
import { useThemesLoader } from "@/hooks/useThemeLoader";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGetSubmissionsStatus, postSolution } from "@/lib/api";
import { Language, Problem, Submission, TestCase, statusMap } from "@/lib/types";
import { useSession } from "next-auth/react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
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
  const [runtime, setRuntime] = useState(40);
  const [input, setInput] = useState("[2, 7, 11, 15], 9");
  const [output, setOutput] = useState("[0, 1]");
  const [expected, setExpected] = useState("[0, 1]");
  const router = useRouter();
  //   const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [recentSubs, setRecentSubs] = useState(recentSubmissions);
  const [code, setCode] = useState<string>("");

  // Submission button stuff
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [currentSubmissionDetails, setCurrentSubmissionDetails] = useState<Submission | null>(null);

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
      setSubmissionId(data.id);
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
      console.log("Setting currentSubmissionDetails to: ", data);
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
                  setSubmissionId={setSubmissionId as any}
                  error={submissionError}
                  submissionLoading={submissionLoading}
                  handleSubmitCode={handleSubmitCode}
                  submissionId={submissionId}
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
              className={cn("w-full min-w-0 bg-card")}
              style={{ overflow: "auto" }}
              ref={ref}
              collapsible={screenWidth >= 768}
              minSize={screenWidth < 768 ? 100 : 20}
              maxSize={screenWidth < 768 ? 100 : 60}
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
            <div className="flex flex-col items-center justify-center">
              <Tooltip>
                <TooltipTrigger>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resize panels</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <ResizablePanel
              defaultSize={rightPanel}
              className="w-full min-w-0 flex-1 bg-background"
              minSize={40}
            >
              <ResizablePanelGroup direction="vertical" className="w-full h-full">
                {/*  Code Editor Section */}
                <ResizablePanel
                  defaultSize={75}
                  minSize={30}
                  maxSize={90}
                  className="w-full min-w-0 bg-card border-b border-border"
                >
                  <div className="flex w-full h-full overflow-hidden">
                    {loading && <EditorSkeleton />}
                    {!loading && (
                      <CodeEditor
                        languages={languages}
                        themes={themes}
                        problemId={details.id}
                        code={code}
                        setCode={setCode}
                        setSubmissionId={setSubmissionId as any}
                        error={submissionError}
                        submissionLoading={submissionLoading}
                        handleSubmitCode={handleSubmitCode}
                        submissionId={submissionId}
                      />
                    )}
                  </div>
                </ResizablePanel>
                <Tooltip>
                  <TooltipTrigger>
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
                  </TooltipTrigger>
                  <TooltipContent sideOffset={10}>
                    <p>Resize editor/results</p>
                  </TooltipContent>
                </Tooltip>
                {/* Submission Section */}
                <ResizablePanel
                  defaultSize={25}
                  style={{
                    overflow: "auto",
                  }}
                  minSize={10}
                  maxSize={70}
                  collapsible
                  onCollapse={collapse2}
                  ref={ref2}
                  collapsedSize={0}
                  className="w-full min-w-0 bg-card"
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
                        defaultValue={`case-${Math.max(0, (testCases?.length || 1) - 1)}`}
                        className={cn("w-full")}
                      >
                        <TabsList className="flex-wrap h-auto gap-1 p-1">
                          <>
                            <TabsTrigger key="custom" value={"case-custom"} className="text-xs sm:text-sm">
                              <span className="hidden sm:inline">Custom Test Case</span>
                              <span className="sm:hidden">Custom</span>
                            </TabsTrigger>
                            {testCases.map((testCase, index) => {
                              // Simple status indicator for tabs
                              const isFailedTestCase = currentSubmissionDetails?.failed_test_case_id === testCase.id;
                              const isBeforeFailedCase = currentSubmissionDetails?.failed_test_case_id &&
                                testCases.findIndex(tc => tc.id === currentSubmissionDetails.failed_test_case_id) > index;

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
                          </>
                        </TabsList>
                        {testCases.map((testCase, index) => {
                          // Determine test case status based on submission details
                          const isFailedTestCase = currentSubmissionDetails?.failed_test_case_id === testCase.id;
                          const isBeforeFailedCase = currentSubmissionDetails?.failed_test_case_id &&
                            testCases.findIndex(tc => tc.id === currentSubmissionDetails.failed_test_case_id) > index;

                          let testStatus = "unknown";
                          if (currentSubmissionDetails) {
                            if (currentSubmissionDetails.status === "ACCEPTED") {
                              testStatus = "passed";
                            } else if (isFailedTestCase) {
                              testStatus = "failed";
                            } else if (isBeforeFailedCase) {
                              testStatus = "passed";
                            } else {
                              testStatus = "not-run";
                            }
                          }

                          return (
                            <TabsContent key={index} value={`case-${index}`}>
                              <div className="space-y-4">
                                <InputCase input={testCase.input} />
                                <Expected expected={testCase.expected_output} />

                                {/* Show actual output based on test status */}
                                {currentSubmissionDetails ? (
                                  <div>
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
                                    {currentSubmissionDetails.stdout ? (
                                      <Output output={currentSubmissionDetails.stdout} />
                                    ) : (
                                      <div className="text-sm text-muted-foreground p-2 border rounded">
                                        No output produced
                                      </div>
                                    )}

                                    {/* Error output */}
                                    {currentSubmissionDetails.stderr && isFailedTestCase && (
                                      <div className="mt-2">
                                        <div className="flex text-xs font-medium text-red-500 mb-2">
                                          Error Output
                                        </div>
                                        <Output output={currentSubmissionDetails.stderr} />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Output output={testCase.expected_output} />
                                )}
                              </div>
                            </TabsContent>
                          );
                        })}
                        <TabsContent value={"case-custom"}>
                          <div>
                            {/* TODO: Control these inputs */}
                            <CustomInput input={input} />
                            {currentSubmissionDetails && (
                              <div className="space-y-2">
                                {currentSubmissionDetails.stdout && (
                                  <div>
                                    <CustomInputResult result={currentSubmissionDetails.stdout} />
                                  </div>
                                )}
                                {currentSubmissionDetails.stderr && (
                                  <div>
                                    <div className="flex text-xs font-medium text-red-500 mb-2">
                                      Error Output
                                    </div>
                                    <CustomInputResult result={currentSubmissionDetails.stderr} />
                                  </div>
                                )}
                              </div>
                            )}
                            {!currentSubmissionDetails && (
                              <CustomInputResult result={output} />
                            )}
                          </div>
                        </TabsContent>
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
