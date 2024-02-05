export interface SubmissionRequest {
  submissionId: string;
  code: string;
  lang: string;
  problemId: string;
  userId: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  join_date: string;
}

export type UserValidationResult = {
  user: User | null;
  isCorrectUser: boolean;
};

export type ApiResponse = User[];

export type Problem = {
  id: number;
  prompt: string;
  timeout: number;
  user_id: number;
  upload_date: string;
};

export type Competition = {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  description: string;
  title: string;
  problems: Problem[];
  participants: User[];
};

export interface BackendSubmission {
  id: number;
  user_id: number;
  problem_id: string;
  time_elapsed: number;
  language: string;
  status: string;
  failed_test_case_id: number;
  submit_time: string;
}

export interface TestCase {
  input?: string;
  output: string;
}

export interface ProblemData {
  problemId: string;
  testCases: TestCase[];
}

export type Status = "AC" | "WA";

export interface SubmissionResult {
  status: Status;
  actualOutput: string;
  expectedOutput: string;
}

export interface JudgeEvent extends MessageEvent {
  data: {
    results: SubmissionResult[];
    isCorrect: boolean;
  };
}
