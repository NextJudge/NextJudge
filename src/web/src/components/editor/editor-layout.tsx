"use client";

import "@/app/globals.css";

import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { ProblemSection } from "@/components/editor/problem-section";
import { TestcaseSection } from "@/components/editor/testcase-section";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemesLoader } from "@/hooks/useThemeLoader";
import {
  apiWaitForSubmissionResult,
  getCustomInputSubmissionStatus,
  postCustomInputSubmission,
  postSolution,
} from "@/lib/api";
import { useEditorStore } from "@/lib/stores/editor-store";
import {
  CustomInputResult as CustomInputResultType,
  Language,
  PracticeRunResult,
  Problem,
  Submission,
  SubmissionStatus,
  statusMap,
  TestCase,
} from "@/lib/types";
import { compareOutput } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";
import CodeEditor from "./code-editor";

const EDITOR_SELECTABLE_SELECTOR =
  ".monaco-editor, textarea, input, [contenteditable='true'], .select-all";

function isEditorSelectableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest(EDITOR_SELECTABLE_SELECTOR));
}

async function executeCodeWithInput(
  token: string,
  code: string,
  languageId: string,
  stdin: string
): Promise<CustomInputResultType> {
  const runId = await postCustomInputSubmission(token, code, languageId, stdin);

  let result = await getCustomInputSubmissionStatus(token, runId);
  while (!result.finished && result.status === "PENDING") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = await getCustomInputSubmissionStatus(token, runId);
  }

  return result;
}

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
  const { data: session } = useSession();
  const authToken = session?.nextjudge_token;
  const authUserId = session?.nextjudge_id;
  const { themes, loading } = useThemesLoader();

  const publicTestCases = testCases.filter((tc) => !tc.hidden);
  const hiddenTestCases = testCases.filter((tc) => tc.hidden);

  const code = useEditorStore((s) => s.code);
  const input = useEditorStore((s) => s.input);
  const submissionLoading = useEditorStore((s) => s.submissionLoading);
  const submissionError = useEditorStore((s) => s.submissionError);
  const currentSubmissionDetails = useEditorStore((s) => s.currentSubmission);
  const runResults = useEditorStore((s) => s.runResults);
  const runLoading = useEditorStore((s) => s.runLoading);
  const runningCaseIndex = useEditorStore((s) => s.runningCaseIndex);
  const activeCaseTab = useEditorStore((s) => s.activeCaseTab);
  const customInputResult = useEditorStore((s) => s.customInputResult);
  const setCode = useEditorStore((s) => s.setCode);
  const setInput = useEditorStore((s) => s.setInput);
  const setActiveCaseTab = useEditorStore((s) => s.setActiveCaseTab);
  const startSubmission = useEditorStore((s) => s.startSubmission);
  const finishSubmission = useEditorStore((s) => s.finishSubmission);
  const startRun = useEditorStore((s) => s.startRun);
  const setRunProgress = useEditorStore((s) => s.setRunProgress);
  const finishRun = useEditorStore((s) => s.finishRun);

  useEffect(() => {
    setActiveCaseTab(publicTestCases.length > 0 ? "case-0" : "case-custom");
  }, [publicTestCases.length, setActiveCaseTab]);

  useEffect(() => {
    const workspace = document.querySelector<HTMLElement>(".editor-workspace");
    if (!workspace) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "a" &&
        !isEditorSelectableTarget(event.target)
      ) {
        event.preventDefault();
      }
    };

    const handleSelectStart = (event: Event) => {
      if (!isEditorSelectableTarget(event.target)) {
        event.preventDefault();
      }
    };

    workspace.addEventListener("keydown", handleKeyDown);
    workspace.addEventListener("selectstart", handleSelectStart);

    return () => {
      workspace.removeEventListener("keydown", handleKeyDown);
      workspace.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  const handleSubmitCode = async (languageId: string, problemId: number) => {
    if (!languageId) {
      toast.error("Please select a language.");
      return;
    }

    startSubmission();
    try {
      if (!authToken || !authUserId) {
        throw new Error("Need to be logged in");
      }
      const data = await postSolution(
        authToken,
        code,
        languageId,
        problemId,
        authUserId,
        contestId
      );
      await fetchSubmissionDetails(data.id);
    } catch (error: unknown) {
      toast.error("There was an error submitting your code.");
      finishSubmission(
        null,
        error instanceof Error ? error.message : "An error occurred.",
      );
    }
  };

  const fetchSubmissionDetails = async (submissionId: string) => {
    try {
      if (!authToken) {
        throw new Error("Need to be logged in");
      }
      const data = await apiWaitForSubmissionResult(authToken, submissionId);

      finishSubmission(data);

      const statusMessage = statusMap[data.status];
      if (data.status === "ACCEPTED") {
        toast.success(`${statusMessage}!`);
      } else {
        toast.error(`${statusMessage}`);
      }
    } catch (error) {
      console.error(error);
      finishSubmission(null, "Failed to fetch submission results.");
      toast.error("Failed to fetch submission results.");
    }
  };

  const handleRun = async (languageId: string) => {
    if (!languageId) {
      toast.error("Please select a language.");
      return;
    }

    startRun();

    try {
      if (!authToken) {
        throw new Error("Need to be logged in");
      }

      if (activeCaseTab === "case-custom") {
        const result = await executeCodeWithInput(
          authToken,
          code,
          languageId,
          input
        );
        setRunProgress({ customInputResult: result });
        finishRun();
        return;
      }

      if (publicTestCases.length === 0) {
        toast.error("No sample test cases available.");
        finishRun();
        return;
      }

      const testCaseResults: PracticeRunResult["test_case_results"] = [];
      let overallStatus: SubmissionStatus = "ACCEPTED";
      let compileStderr = "";

      for (let i = 0; i < publicTestCases.length; i++) {
        const testCase = publicTestCases[i];
        setRunProgress({ runningCaseIndex: i });

        const result = await executeCodeWithInput(
          authToken,
          code,
          languageId,
          testCase.input
        );

        if (result.status === "COMPILE_TIME_ERROR") {
          overallStatus = "COMPILE_TIME_ERROR";
          compileStderr = result.stderr;
          setRunProgress({
            runResults: {
              status: overallStatus,
              test_case_results: testCaseResults,
              stderr: compileStderr || undefined,
            },
          });
          break;
        }

        const passed =
          result.status === "ACCEPTED" &&
          compareOutput(testCase.expected_output, result.stdout ?? "");

        testCaseResults.push({
          test_case_id: testCase.id,
          stdout: result.stdout ?? "",
          stderr: result.stderr ?? "",
          passed,
        });

        if (!passed) {
          overallStatus =
            result.status === "ACCEPTED" ? "WRONG_ANSWER" : result.status;
        }

        setRunProgress({
          runResults: {
            status: overallStatus,
            test_case_results: [...testCaseResults],
          },
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to run test cases.");
    } finally {
      finishRun();
    }
  };

  const handleRestoreSubmissionCode = (sourceCode: string, languageId: string) => {
    const language = languages.find((lang) => lang.id === languageId);
    setCode(sourceCode);
    toast.success(
      language
        ? `Restored ${language.name} submission in the editor.`
        : "Restored submission code in the editor."
    );
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-full min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={50} minSize={25}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel
                defaultSize={60}
                minSize={25}
                className="border rounded-lg overflow-hidden"
              >
                <div className="h-full bg-card">
                  <ProblemSection
                    details={details}
                    tags={tags}
                    slot={slot}
                    recentSubmissions={recentSubmissions}
                    onUseSubmissionCode={handleRestoreSubmissionCode}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="my-1 bg-background hover:bg-[var(--color-section-splitter)] transition-all"
              />
              <ResizablePanel
                defaultSize={40}
                minSize={20}
                className="border rounded-lg overflow-hidden"
              >
                <div className="h-full bg-card">
                  <TestcaseSection
                    publicTestCases={publicTestCases}
                    hiddenTestCases={hiddenTestCases}
                    input={input}
                    setInput={setInput}
                    activeCaseTab={activeCaseTab}
                    onActiveCaseTabChange={setActiveCaseTab}
                    runLoading={runLoading}
                    runResults={runResults}
                    runningCaseIndex={runningCaseIndex}
                    customInputResult={customInputResult}
                    submissionLoading={submissionLoading}
                    submissionError={submissionError}
                    currentSubmissionDetails={currentSubmissionDetails}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="mx-1 bg-background hover:bg-[var(--color-section-splitter)] transition-all"
          />

          <ResizablePanel
            defaultSize={50}
            minSize={25}
            className="border rounded-lg overflow-hidden"
          >
            <div className="h-full bg-card">
              {loading && <EditorSkeleton />}
              {!loading && (
                <CodeEditor
                  languages={languages}
                  themes={themes}
                  problemId={details.id}
                  code={code}
                  setCode={setCode}
                  submissionLoading={submissionLoading}
                  handleSubmitCode={handleSubmitCode}
                  runLoading={runLoading}
                  onRun={handleRun}
                />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
