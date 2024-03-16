export interface User {
  id: number;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  joinDate: Date;
}

export interface Problem {
  id: number;
  prompt: string;
  title: string;
  timeout: number;
  userId: number;
  uploadDate: Date;
  testCases: TestCase[];
}

export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

export interface Submission {
  id: number;
  userId: number;
  problemId: number;
  timeElapsed: number;
  languageId: number;
  status: string;
  failedTestCaseId?: number;
  submitTime: Date;
  sourceCode: string;
}

export interface Competition {
  id: number;
  userId: number;
  startTime: Date;
  endTime: Date;
  description: string;
  title: string;
  problems: Problem[];
  participants: User[];
}

export type Contest = Competition;

export interface Language {
  id: number;
  name: string;
  extension: string;
  version: string;
}

export type Theme = {
  name: string;
  fetch: string;
};
