"use client";

import "@/app/globals.css";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  TestCases,
  TRecentSubmission,
  ZodProblemDetails,
} from "@/app/platform/problems/(problem)/[id]/page";
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
import { useEditorTheme } from "@/hooks/useEditorTheme";
import { useThemesLoader } from "@/hooks/useThemeLoader";
import { cn } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";
import { Language, Theme } from "@/types";
import "katex/dist/katex.min.css";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { useSubmitCode } from "@/hooks/useSubmitCode";
import { useContext, useEffect, useState } from "react";
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

const problemStatement = `
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
`;

const darkDefault: Theme = {
  name: "brilliance-black",
  fetch: "/themes/Brilliance Black.json",
};
const lightDefault: Theme = {
  name: "github-light",
  fetch: "/themes/GitHub Light.json".replace(" ", "%20"),
};

export default function EditorComponent({
  details,
  slot,
  tags,
  testCases,
  recentSubmissions,
  languages,
  userId,
}: {
  details: ZodProblemDetails;
  tags: string[];
  slot: React.ReactNode;
  testCases: TestCases;
  recentSubmissions: TRecentSubmission;
  languages: Language[];
  userId: number;
}) {
  const { isCollapsed, ref, collapse, expand } = useEditorCollapse();
  const {
    isCollapsed: isCollapsed2,
    ref: ref2,
    collapse: collapse2,
    expand: expand2,
  } = useEditorCollapse();
  const { resolvedTheme } = useTheme();
  const defaultColorScheme =
    resolvedTheme === "dark" ? darkDefault : lightDefault;
  const { setTheme } = useContext(ThemeContext);
  const { themes, loading } = useThemesLoader();
  const { onSelect } = useEditorTheme(resolvedTheme, defaultColorScheme);
  const [runtime, setRuntime] = useState(40);
  const [input, setInput] = useState("[2, 7, 11, 15], 9");
  const [output, setOutput] = useState("[0, 1]");
  const [expected, setExpected] = useState("[0, 1]");
  const router = useRouter();
  //   const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [recentSubs, setRecentSubs] = useState(recentSubmissions);
  const [code, setCode] = useState<string>("");

  const {
    handleSubmitCode,
    error,
    submissionId,
    submissionLoading,
    setSubmissionId,
    currentSubmissionDetails,
    setCurrentSubmissionDetails,
    fetchSubmissionDetails,
  } = useSubmitCode(userId, code);

  async function getRecentSubmissionsForProblem() {
    try {
      const data = await fetch(`/api/submissions?problemId=${details.id}`);
      //TODO: Address this
      //   revalidatePath(`/api/submissions?problemId=${details.id}`);
      const submissions = await data.json();
      console.log({ submissions });
      return submissions;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  useEffect(() => {
    (async () => {
      await fetchSubmissionDetails();
      ref2.current?.expand();
      expand2();
      const submissions = await getRecentSubmissionsForProblem();
      setRecentSubs(submissions);
    })();
  }, [submissionId]);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        className={cn(
          "relative max-w-screen border max-h-[calc(100vh-3.55rem)] min-h-[93svh] w-full"
        )}
      >
        {/* Problem Statement Section */}
        <ResizablePanel
          defaultSize={25}
          className={cn("w-full")}
          style={{ overflow: "auto" }}
          ref={ref}
          collapsible
          minSize={10}
          onCollapse={collapse}
        >
          <div>
            <div className=" p-4 overflow-auto">
              <div className="flex flex-col min-w-56 max-w-2xl gap-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">{details.title}</h1>
                  <Badge variant="secondary" className="text-xs">
                    {details.difficulty
                      ? details.difficulty.charAt(0) +
                        details.difficulty.slice(1).toLowerCase()
                      : ""}
                  </Badge>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <div className="text-xs text-accent-foreground">
                    <span>Tags:</span>
                  </div>
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
                        "text-xs",
                        "bg-accent-background",
                        "text-accent-foreground",
                        "hover:underline",
                        "hover:cursor-pointer"
                      )}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div>{slot}</div>
              </div>
            </div>
          </div>
          {/* Collapsed */}
        </ResizablePanel>
        <div className="flex flex-col dark:border-r border-r dark:border-neutral-800 items-center justify-center border-secondary-muted">
          <Tooltip>
            <TooltipTrigger>
              <ResizableHandle
                withHandle
                className={cn(
                  {
                    "transform translate-x-2 z-50": isCollapsed,
                  },
                  "cursor-col-resize"
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
              <p>Resize</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <ResizablePanel defaultSize={75} className="w-[70dvw] max-w-screen-2xl">
          <ResizablePanelGroup direction="vertical" className="w-full">
            {/*  Code Editor Section */}
            <ResizablePanel
              defaultSize={80}
              minSize={40}
              className="min-w-full"
            >
              <div className="flex w-full h-full items-center justify-center overflow-y-scroll">
                {loading && <EditorSkeleton />}
                {!loading && (
                  <CodeEditor
                    userId={userId}
                    themes={themes}
                    problemId={details.id}
                    code={code}
                    setCode={setCode}
                    setSubmissionId={setSubmissionId as any}
                    error={error}
                    submissionLoading={submissionLoading}
                    handleSubmitCode={handleSubmitCode}
                    submissionId={submissionId}
                    fetchSubmissionDetails={fetchSubmissionDetails}
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
                      "transform translate-x-2 z-50 mb-2": isCollapsed2,
                    },
                    "cursor-row-resize"
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
                <p>Resize</p>
              </TooltipContent>
            </Tooltip>
            {/* Submission Section */}
            <ResizablePanel
              defaultSize={5}
              style={{
                overflow: "auto",
              }}
              minSize={0}
              maxSize={50}
              collapsible
              onCollapse={collapse2}
              ref={ref2}
              collapsedSize={0}
              className="backdrop-filter backdrop-blur-3xl"
            >
              <div className="mx-5 my-4 space-y-4 h-100 overflow-auto">
                <div className="flex items-center">
                  <div className="text-lg font-bold">
                    {/* TODO: clean this up */}
                    {submissionLoading && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-yellow-500">
                          Pending
                        </span>
                        <Icons.loader className="mr-2 w-6 h-6 animate-spin" />
                      </div>
                    )}
                    {error && (
                      <div className="text-sm text-center">{error}</div>
                    )}
                    {!currentSubmissionDetails &&
                      !submissionLoading &&
                      !error && <span>Submission Details</span>}
                    {currentSubmissionDetails && !submissionLoading && (
                      <SubmissionState submission={currentSubmissionDetails} />
                    )}
                  </div>
                  <div className="ml-auto flex min-w-0 items-center space-x-4">
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button
                          variant="outline"
                          className="scale-90 flex gap-2"
                        >
                          <Icons.eye className="w-4 h-4" />
                          <span>View Submissions</span>
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
                                {recentSubmissions.map((submission) => (
                                  <RecentSubmissionCard
                                    submission={submission}
                                    key={submission.id}
                                  />
                                ))}
                              </ul>
                            </TabsContent>
                            <TabsContent value="category">
                              <ul className="grid grid-flow-row grid-cols-3 gap-4">
                                {recentSubmissions.map((submission) => (
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
                <div className="flex flex-wrap gap-x-2 gap-y-4">
                  <Tabs
                    defaultValue={`case-${testCases.length - 1}`}
                    className={cn("w-full")}
                  >
                    <TabsList>
                      <>
                        <TabsTrigger key="custom" value={"case-custom"}>
                          Custom Test Case
                        </TabsTrigger>
                        {testCases.map((_, index) => (
                          <TabsTrigger key={index} value={`case-${index}`}>
                            Test Case {index + 1}
                          </TabsTrigger>
                        ))}
                      </>
                    </TabsList>
                    {testCases.map((testCase, index) => (
                      <TabsContent key={index} value={`case-${index}`}>
                        <div className="space-y-4">
                          <InputCase input={testCase.input} />
                          <Expected expected={testCase.expected_output} />
                          {/* TODO: Use actual solution output */}
                          <Output output={testCase.expected_output} />
                        </div>
                      </TabsContent>
                    ))}
                    <TabsContent value={"case-custom"}>
                      <div>
                        {/* TODO: Control these inputs */}
                        <CustomInput input={input} />
                        <CustomInputResult result={output} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
