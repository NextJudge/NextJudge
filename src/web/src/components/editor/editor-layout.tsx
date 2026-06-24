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
  apiGetSubmissionsStatus,
  getCustomInputSubmissionStatus,
  postCustomInputSubmission,
  postSolution,
} from "@/lib/api";
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
import { useEffect, useState } from "react";
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

  const [input, setInput] = useState("");
  const [code, setCode] = useState<string>("");

  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>("");
  const [currentSubmissionDetails, setCurrentSubmissionDetails] =
    useState<Submission | null>(null);

  const [runResults, setRunResults] = useState<PracticeRunResult | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runningCaseIndex, setRunningCaseIndex] = useState<number | null>(null);
  const [activeCaseTab, setActiveCaseTab] = useState(
    publicTestCases.length > 0 ? "case-0" : "case-custom"
  );
  const [customInputResult, setCustomInputResult] =
    useState<CustomInputResultType | null>(null);

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

    setSubmissionLoading(true);
    setSubmissionError("");
    setRunResults(null);
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
      setSubmissionError(
        error instanceof Error ? error.message : "An error occurred."
      );
    } finally {
      setSubmissionLoading(false);
    }
  };

  const fetchSubmissionDetails = async (submissionId: string) => {
    try {
      if (!authToken) {
        throw new Error("Need to be logged in");
      }
      let data: Submission = await apiGetSubmissionsStatus(
        authToken,
        submissionId
      );
      while (data.status === "PENDING") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        data = await apiGetSubmissionsStatus(
          authToken,
          submissionId
        );
      }

      setSubmissionLoading(false);
      setCurrentSubmissionDetails(data);

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
  };

  const handleRun = async (languageId: string) => {
    if (!languageId) {
      toast.error("Please select a language.");
      return;
    }

    setRunLoading(true);
    setRunResults(null);
    setCustomInputResult(null);
    setRunningCaseIndex(null);
    setCurrentSubmissionDetails(null);

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
        setCustomInputResult(result);
        return;
      }

      if (publicTestCases.length === 0) {
        toast.error("No sample test cases available.");
        return;
      }

      const testCaseResults: PracticeRunResult["test_case_results"] = [];
      let overallStatus: SubmissionStatus = "ACCEPTED";
      let compileStderr = "";

      for (let i = 0; i < publicTestCases.length; i++) {
        const testCase = publicTestCases[i];
        setRunningCaseIndex(i);

        const result = await executeCodeWithInput(
          authToken,
          code,
          languageId,
          testCase.input
        );

        if (result.status === "COMPILE_TIME_ERROR") {
          overallStatus = "COMPILE_TIME_ERROR";
          compileStderr = result.stderr;
          setRunResults({
            status: overallStatus,
            test_case_results: testCaseResults,
            stderr: compileStderr || undefined,
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

        setRunResults({
          status: overallStatus,
          test_case_results: [...testCaseResults],
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to run test cases.");
    } finally {
      setRunLoading(false);
      setRunningCaseIndex(null);
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
