declare var self: Worker;

interface TestCase {
  input?: string;
  output: string;
}

interface Problem {
  problemId: string;
  testCases: TestCase[];
}

const problem: Problem = {
  problemId: "1",
  testCases: [{ output: "hello world" }],
};

type Status = "AC" | "WA";

const STATUSES: Record<Status, Status> = {
  AC: "AC",
  WA: "WA",
};

const judgeCode = (codeToJudge: string, testCase: TestCase) => {
  const { output } = testCase;
  if (String(codeToJudge).trim() === String(output).trim()) {
    postMessage(STATUSES.AC);
  } else {
    postMessage(STATUSES.WA);
  }
};

self.onmessage = (code: MessageEvent) => {
  console.log("[Judge] Grading submission... \n\n");

  const codeToJudge = code.data;

  problem.testCases.forEach((testCase) => {
    judgeCode(codeToJudge, testCase);
  });
};
