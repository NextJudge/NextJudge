export interface TestCase {
  input: string;
  output: string;
}

export interface CodeParams {
  code: string;
  language: string;
  base64?: boolean;
  testCases: TestCase[];
  timeout: number;
}

export interface Code extends CodeParams {
  id: string;
}

export interface Tests {
  input: string;
  expectedOutput: string;
  obtainedOutput: string;
  remarks: string;
  exitCode: number;
  runTime: number;
  error: string;
}

export interface Result {
  id: string;
  tests: Tests[];
}

export interface WorkerOptions {
  folderPath?: string;
  memory?: number;
  CPUs?: number;
}

export interface WorkerCLIOptions {
  queue: string;
  redis: string;
  langs: string[];
}
