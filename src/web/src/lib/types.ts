

export interface Language {
    id: string;
    name: string;
    extension: string;
    version: string;
}

export interface Problem {
    id: number;
    prompt: string;
    title: string;
    timeout: number;
    difficulty: Difficulty;
    user_id: string;
    upload_date: string;
    test_cases?: TestCase[];
    categories: Category[];
}

export interface TestCase {
    id: string;
    problem_id: number;
    input: string;
    is_public: boolean;
    expected_output: string;
}


export interface Category {
    id: string;
    name: string;
}

type Difficulty = "VERY EASY" | "EASY" | "MEDIUM" | "HARD" | "VERY HARD"


export enum status {
    ACCEPTED = "Accepted",
    WRONG_ANSWER = "Wrong Answer",
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded",
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded",
    RUNTIME_ERROR = "Runtime Error",
    COMPILE_TIME_ERROR = "Compile Time Error",
    PENDING = "Pending",
}

export const statusMap: Record<string, string> = {
    ACCEPTED: status.ACCEPTED,
    WRONG_ANSWER: status.WRONG_ANSWER,
    TIME_LIMIT_EXCEEDED: status.TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED: status.MEMORY_LIMIT_EXCEEDED,
    RUNTIME_ERROR: status.RUNTIME_ERROR,
    COMPILE_TIME_ERROR: status.COMPILE_TIME_ERROR,
    PENDING: status.PENDING,
};


export type SubmissionStatus =
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "COMPILE_TIME_ERROR"
    | "PENDING";


export interface Submission {
    id: string;
    user_id: string
    problem_id: number;
    problem: Problem
    time_elapsed: number;
    language_id: string;
    language: Language
    status: SubmissionStatus;
    failed_test_case_id?: string;
    submit_time: string;
    source_code: string;
    stdout: string;
    stderr: string;
}
