import {
  CustomInputResult,
  PracticeRunResult,
  Submission,
} from "@/lib/types";
import { create } from "zustand";

interface EditorState {
  code: string;
  input: string;
  submissionLoading: boolean;
  submissionError: string;
  currentSubmission: Submission | null;
  runResults: PracticeRunResult | null;
  runLoading: boolean;
  runningCaseIndex: number | null;
  activeCaseTab: string;
  customInputResult: CustomInputResult | null;
  setCode: (code: string) => void;
  setInput: (input: string) => void;
  setActiveCaseTab: (tab: string) => void;
  startSubmission: () => void;
  finishSubmission: (submission: Submission | null, error?: string) => void;
  startRun: () => void;
  setRunProgress: (results: {
    runResults?: PracticeRunResult | null;
    customInputResult?: CustomInputResult | null;
    runningCaseIndex?: number | null;
  }) => void;
  finishRun: () => void;
  resetRunState: () => void;
  resetSubmissionState: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: "",
  input: "",
  submissionLoading: false,
  submissionError: "",
  currentSubmission: null,
  runResults: null,
  runLoading: false,
  runningCaseIndex: null,
  activeCaseTab: "case-custom",
  customInputResult: null,
  setCode: (code) => set({ code }),
  setInput: (input) => set({ input }),
  setActiveCaseTab: (activeCaseTab) => set({ activeCaseTab }),
  startSubmission: () =>
    set({
      submissionLoading: true,
      submissionError: "",
      runResults: null,
      currentSubmission: null,
    }),
  finishSubmission: (currentSubmission, error) =>
    set({
      submissionLoading: false,
      currentSubmission,
      submissionError: error ?? "",
    }),
  startRun: () =>
    set({
      runLoading: true,
      runResults: null,
      customInputResult: null,
      runningCaseIndex: null,
      currentSubmission: null,
    }),
  setRunProgress: ({ runResults, customInputResult, runningCaseIndex }) =>
    set((state) => ({
      runResults: runResults !== undefined ? runResults : state.runResults,
      customInputResult:
        customInputResult !== undefined
          ? customInputResult
          : state.customInputResult,
      runningCaseIndex:
        runningCaseIndex !== undefined
          ? runningCaseIndex
          : state.runningCaseIndex,
    })),
  finishRun: () => set({ runLoading: false, runningCaseIndex: null }),
  resetRunState: () =>
    set({
      runResults: null,
      runLoading: false,
      runningCaseIndex: null,
      customInputResult: null,
    }),
  resetSubmissionState: () =>
    set({
      submissionLoading: false,
      submissionError: "",
      currentSubmission: null,
    }),
}));
