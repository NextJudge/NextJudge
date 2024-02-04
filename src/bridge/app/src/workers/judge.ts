import { ProblemData, Status, SubmissionResult, TestCase } from "@util/types";

declare var self: Window & typeof globalThis;

const problem: ProblemData = {
  problemId: "1",
  testCases: [{ output: "Hello, World!" }],
};

const STATUSES: Record<Status, Status> = {
  AC: "AC",
  WA: "WA",
};

const judgeCode = (
  codeToJudge: string,
  testCase: TestCase
): SubmissionResult => {
  const { output } = testCase;
  if (String(codeToJudge).trim() === String(output).trim()) {
    return {
      status: STATUSES.AC,
      actualOutput: codeToJudge.trim(),
      expectedOutput: output,
    };
  } else {
    return {
      status: STATUSES.WA,
      actualOutput: codeToJudge.trim(),
      expectedOutput: output,
    };
  }
};

self.onmessage = (code: MessageEvent) => {
  const codeToJudge = code.data;
  const results: SubmissionResult[] = problem.testCases.map((testCase) => {
    return judgeCode(codeToJudge, testCase);
  });

  const isCorrect = results.every((result) => result.status === STATUSES.AC);

  postMessage({ results, isCorrect });
};
