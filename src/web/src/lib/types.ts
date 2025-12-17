

export interface User {
	id: string;
	account_identifier: string;
	name: string;
	email: string;
	emailVerified: string;
	image: string;
	join_date: string;
	is_admin: boolean;
}

export interface UserWithStats extends User {
	contest_count: number;
	submission_count: number;
}

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
	updated_at: string;
	test_cases: TestCase[];
	categories: Category[];
	public?: boolean;
	identifier: string;
	source: string;
	accept_timeout: number;
	execution_timeout: number;
	memory_limit: number;
}

export interface NextJudgeEvent {
	id: number;
	user_id: string;
	title: string;
	description: string;
	start_time: string;
	end_time: string;
	teams: boolean;
	problems?: Problem[];
	participants?: User[];
	participant_count?: number;
	problem_count?: number;
}

export interface CreateEventRequest {
	title: string;
	description: string;
	start_time: string;
	end_time: string;
	teams: boolean;
	languages?: number[];
	problems?: EventProblemRequest[];
}

export interface EventProblemRequest {
	problem_id: number;
	accept_timeout?: number;
	execution_timeout?: number;
	memory_limit?: number;
	languages?: number[];
}

export interface TestCase {
	id: string;
	problem_id: number;
	input: string;
	expected_output: string;
	hidden: boolean;
}

export interface Category {
	id: string;
	name: string;
}

export type Difficulty = "VERY EASY" | "EASY" | "MEDIUM" | "HARD" | "VERY HARD";

// For form/API consistency - matches Go PostProblemRequestBody
export interface ProblemRequest {
	title: string;
	identifier: string;
	prompt: string;
	source: string;
	difficulty: Difficulty;
	timeout: number;
	accept_timeout?: number;
	execution_timeout?: number;
	memory_limit?: number;
	user_id: string;
	test_cases: CreateTestCaseRequest[];
	category_ids: string[];
	public: boolean;
}

export interface CreateTestCaseRequest {
	input: string;
	expected_output: string;
	hidden?: boolean;
}

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

export interface TestCaseResult {
	id: string;
	submission_id: string;
	test_case_id: string;
	stdout: string;
	stderr: string;
	passed: boolean;
}

export interface Submission {
	id: string;
	user_id: string;
	problem_id: number;
	problem: Problem;
	time_elapsed: number;
	language_id: string;
	language: Language;
	status: SubmissionStatus;
	failed_test_case_id?: string;
	submit_time: string;
	source_code: string;
	stdout: string;
	stderr: string;
	test_case_results?: TestCaseResult[];
}

export interface EventQuestion {
	id: string;
	event_id: number;
	user_id: string;
	problem_id?: number;
	question: string;
	is_answered: boolean;
	created_at: string;
	updated_at: string;
	answer?: string;
	answered_at?: string;
	answered_by?: string;
	user?: User;
	problem?: Problem;
	answerer?: User;
}

export interface CreateQuestionRequest {
	question: string;
	problem_id?: number;
}

export interface AnswerQuestionRequest {
	answer: string;
}

export interface NotificationCount {
	count: number;
}

export interface Notification {
	id: string;
	user_id: string;
	event_id: number;
	question_id: string;
	notification_type: "question" | "answer";
	is_read: boolean;
	created_at: string;
	updated_at: string;
	question?: EventQuestion;
}

export interface CustomInputResult {
	status: SubmissionStatus | "PENDING";
	stdout: string;
	stderr: string;
	finished: boolean;
	runtime: number;
}


// export interface Competition {
//     id: number;
//     userId: number;
//     startTime: Date;
//     endTime: Date;
//     description: string;
//     title: string;
//     problems: Problem[];
//     participants: User[];
// }
