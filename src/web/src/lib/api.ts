import {
	AnswerQuestionRequest,
	Category,
	CreateEventRequest,
	CreateQuestionRequest,
	CustomInputResult,
	EventQuestion,
	Language,
	NextJudgeEvent,
	Notification,
	NotificationCount,
	Problem,
	ProblemRequest,
	Submission,
	User,
} from "./types";
import { getBridgeUrl } from "./utils";

export async function apiGetLanguages(): Promise<Language[]> {
	try {
		const data = await fetch(`${getBridgeUrl()}/v1/languages`);
		if (!data.ok) {
			throw new Error(`Failed to fetch languages: ${data.status}`);
		}
		return data.json();
	} catch (error) {
		console.error("Failed to fetch languages:", error);
		return [{
			id: "typescript-fallback",
			name: "TypeScript",
			extension: "ts",
			version: "5.4.5",
		}];
	}
}

export async function apiGetCategories(token: string): Promise<Category[]> {
	const data = await fetch(`${getBridgeUrl()}/v1/categories`, {
		headers: {
			Authorization: token,
		},
	});
	return data.json();
}

export async function apiGetUser(
	token: string,
	user_id: string,
): Promise<User> {
	const data = await fetch(`${getBridgeUrl()}/v1/users/${user_id}`, {
		headers: {
			Authorization: token,
		},
	});
	return data.json();
}

export async function apiGetProblemCategories(
	token: string,
	problem_id: number,
) {
	const data = await fetch(`${getBridgeUrl()}/v1/categories/${problem_id}`, {
		headers: {
			Authorization: token,
		},
	});
	return data.json();
}

export async function apiGetProblems(token: string): Promise<Problem[]> {
	try {
		const data = await fetch(`${getBridgeUrl()}/v1/problems`, {
			headers: {
				Authorization: token,
			},
		});
		return data.json();
	} catch (e) {
		throw new Error("Failed to fetch problems");
	}
}

export async function apiGetProblem(
	token: string,
	problemId: number,
): Promise<Problem> {
	try {
		const data = await fetch(`${getBridgeUrl()}/v1/problems/${problemId}`, {
			headers: {
				Authorization: token,
			},
		});

		if (!data.ok) {
			throw new Error(`Failed to fetch problem: ${data.status}`);
		}

		return data.json();
	} catch (error) {
		console.error("Error fetching problem:", error);
		throw error;
	}
}

export async function apiToggleProblemVisibility(
	token: string,
	problemId: number,
): Promise<Problem> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/admin/problems/${problemId}/toggle-visibility`,
			{
				method: "PUT",
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (e) {
		throw new Error("Failed to toggle problem visibility");
	}
}

export async function apiGetEvents(token: string): Promise<NextJudgeEvent[]> {
	try {
		const data = await fetch(`${getBridgeUrl()}/v1/events`, {
			headers: {
				Authorization: token,
			},
		});
		return data.json();
	} catch (e) {
		throw new Error("Failed to fetch problems");
	}
}

export async function apiGetPublicEvents(
	token: string,
): Promise<NextJudgeEvent[]> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/public/events`, {
			headers: {
				Authorization: token,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching public events:", error);
		throw error;
	}
}

export async function fetchProblemID(
	token: string,
	id: number,
): Promise<Problem> {
	try {
		const data = await fetch(`${getBridgeUrl()}/v1/problems/${id}`, {
			headers: {
				Authorization: token,
			},
		});
		return data.json();
	} catch (e) {
		throw new Error("Failed to fetch problem");
	}
}

export async function postSolution(
	token: string,
	code: string,
	language_id: string,
	problem_id: number,
	user_id: string,
	event_id?: number,
) {
	const requestBody: any = {
		source_code: code,
		language_id: language_id,
		problem_id: problem_id,
	};

	// Only include event_id if submitting to a contest
	if (event_id !== undefined && event_id !== 0) {
		requestBody.event_id = event_id;
	}

	const response = await fetch(`${getBridgeUrl()}/v1/submissions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: token,
		},
		body: JSON.stringify(requestBody),
	});

	return response.json();
}

export async function apiGetSubmissionsStatus(
	token: string,
	id: string,
): Promise<Submission> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/submissions/${id}`, {
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching submission status:", error);
		throw error;
	}
}

export async function apiGetRecentSubmissions(
	token: string,
	user_id: string,
): Promise<Submission[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/user_submissions/${user_id}`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching recent submissions:", error);
		throw error;
	}
}

export async function apiGetRecentSubmissionsForProblem(
	token: string,
	problem_id: number,
	user_id: string,
): Promise<Submission[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/user_problem_submissions/${user_id}/${problem_id}`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching problem submissions:", error);
		throw error;
	}
}

// TODO:
// Create problem
// interface CreateProblemData {
//     title: string;
//     prompt: string;
//     timeout: number;
//     difficulty: Difficulty;
//     upload_date: Date;
//     categories?: string[];
//     input?: string;
//     output?: string;
//     is_public?: boolean;
// }

export async function apiCreateProblem(token: string, data: ProblemRequest) {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/problems`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error creating problem:", error);
		throw error;
	}
}

export async function apiUpdateProblem(
	token: string,
	problemId: number,
	data: ProblemRequest,
) {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/problems/${problemId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error updating problem:", error);
		throw error;
	}
}

export async function apiCreateEvent(
	token: string,
	data: CreateEventRequest,
): Promise<NextJudgeEvent> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/events`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error creating event:", error);
		throw error;
	}
}

export async function apiUpdateEvent(
	token: string,
	id: number,
	data: Partial<CreateEventRequest>,
): Promise<NextJudgeEvent> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/events/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error updating event:", error);
		throw error;
	}
}

export async function apiDeleteEvent(token: string, id: number): Promise<void> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/events/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: token,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
	} catch (error) {
		console.error("API Error deleting event:", error);
		throw error;
	}
}

export async function apiGetEvent(
	token: string,
	id: number,
): Promise<NextJudgeEvent> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/events/${id}`, {
			headers: {
				Authorization: token,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching event:", error);
		throw error;
	}
}

export async function apiDeleteProblem(
	token: string,
	problemId: number,
): Promise<void> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/problems/${problemId}`, {
			method: "DELETE",
			headers: {
				Authorization: token,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
	} catch (error) {
		console.error("API Error deleting problem:", error);
		throw error;
	}
}

export async function apiGetUsers(token: string): Promise<User[]> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/users`, {
			headers: {
				Authorization: token,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching users:", error);
		throw error;
	}
}

export async function apiAddEventParticipant(
	token: string,
	eventId: number,
	userId: string,
): Promise<void> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/participants`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: token,
				},
				body: JSON.stringify({ user_id: userId }),
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
	} catch (error) {
		console.error("API Error adding participant:", error);
		throw error;
	}
}

export async function apiRegisterForEvent(
	token: string,
	eventId: number,
): Promise<void> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/public/events/${eventId}/register`,
			{
				method: "POST",
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
	} catch (error) {
		console.error("API Error registering for event:", error);
		throw error;
	}
}

export async function apiGetEventWithDetails(
	token: string,
	eventId: number,
): Promise<NextJudgeEvent> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/public/events/${eventId}`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching event details:", error);
		throw error;
	}
}

export async function apiGetEventProblems(
	token: string,
	eventId: number,
): Promise<Problem[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/problems`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching event problems:", error);
		throw error;
	}
}

export async function apiGetEventParticipants(
	token: string,
	eventId: number,
): Promise<User[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/public/events/${eventId}/participants`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching event participants:", error);
		throw error;
	}
}

export async function apiGetUserSubmissionCount(
	token: string,
	userId: string,
): Promise<number> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/users/${userId}/submissions/count`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.count || 0;
	} catch (error) {
		console.error("API Error fetching user submission count:", error);
		throw error;
	}
}

export async function apiGetUserContestCount(
	token: string,
	userId: string,
): Promise<number> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/users/${userId}/contests/count`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.count || 0;
	} catch (error) {
		console.error("API Error fetching user contest count:", error);
		throw error;
	}
}

export async function apiGetTopUsersByContests(
	token: string,
	limit: number = 10,
): Promise<Array<User & { contest_count: number; submission_count: number }>> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/users/top-by-contests?limit=${limit}`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching top users by contests:", error);
		throw error;
	}
}

export interface EventProblemStats {
	problem_id: number;
	accepted_count: number;
}

export interface UserEventProblemStatus {
	problem_id: number;
	status: string;
	submit_time: string;
}

export async function apiGetEventProblemsStats(
	token: string,
	eventId: number,
): Promise<EventProblemStats[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/problems_stats`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching event problems stats:", error);
		throw error;
	}
}

export async function apiGetUserEventProblemsStatus(
	token: string,
	eventId: number,
): Promise<UserEventProblemStatus[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/user_problem_status`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching user event problems status:", error);
		throw error;
	}
}

export async function apiGetEventSubmissions(
	token: string,
	eventId: number,
): Promise<Submission[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/submissions`,
			{
				headers: {
					Authorization: token,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error("API Error fetching event submissions:", error);
		throw error;
	}
}

export interface EventProblemAttemptDTO {
	user_id: string;
	problem_id: number;
	attempts: number; // attempts up to and including accepted (or all for unsolved)
	total_attempts: number; // all submissions regardless of solve
	first_accepted_time?: string; // ISO string
	minutes_to_solve?: number;
}

export async function apiGetEventAttempts(
	token: string,
	eventId: number,
): Promise<EventProblemAttemptDTO[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/attempts`,
			{
				headers: {
					Authorization: token,
				},
			},
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
		return await response.json();
	} catch (error) {
		console.error("API Error fetching event attempts:", error);
		throw error;
	}
}

export async function apiGetEventQuestions(
	token: string,
	eventId: number,
): Promise<EventQuestion[]> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/questions`,
			{
				headers: {
					Authorization: token,
				},
			},
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
		return await response.json();
	} catch (error) {
		console.error("API Error fetching event questions:", error);
		throw error;
	}
}

export async function apiCreateEventQuestion(
	token: string,
	eventId: number,
	questionData: CreateQuestionRequest,
): Promise<EventQuestion> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/questions`,
			{
				method: "POST",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(questionData),
			},
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
		return await response.json();
	} catch (error) {
		console.error("API Error creating event question:", error);
		throw error;
	}
}

export async function apiAnswerEventQuestion(
	token: string,
	eventId: number,
	questionId: string,
	answerData: AnswerQuestionRequest,
): Promise<void> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/events/${eventId}/questions/${questionId}/answer`,
			{
				method: "PUT",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(answerData),
			},
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
	} catch (error) {
		console.error("API Error answering event question:", error);
		throw error;
	}
}

export async function apiGetNotificationsCount(
	token: string,
): Promise<NotificationCount> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/user/notifications/count`,
			{
				headers: {
					Authorization: token,
				},
			},
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
		return await response.json();
	} catch (error) {
		console.error("API Error fetching notifications count:", error);
		throw error;
	}
}

export async function apiGetUserNotifications(
	token: string,
): Promise<Notification[]> {
	try {
		const response = await fetch(`${getBridgeUrl()}/v1/user/notifications`, {
			headers: {
				Authorization: token,
			},
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
		return await response.json();
	} catch (error) {
		console.error("API Error fetching user notifications:", error);
		throw error;
	}
}

export async function apiMarkNotificationsAsRead(token: string): Promise<void> {
	try {
		const response = await fetch(
			`${getBridgeUrl()}/v1/user/notifications/mark-read`,
			{
				method: "PUT",
				headers: {
					Authorization: token,
				},
			},
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}
	} catch (error) {
		console.error("API Error marking notifications as read:", error);
		throw error;
	}
}

export async function postCustomInputSubmission(
	token: string,
	code: string,
	languageId: string,
	stdin: string,
): Promise<string> {
	const response = await fetch(`${getBridgeUrl()}/v1/input_submissions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: token,
		},
		body: JSON.stringify({
			source_code: code,
			language_id: languageId,
			stdin: stdin,
		}),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || `HTTP error! status: ${response.status}`,
		);
	}

	return response.text();
}

export async function getCustomInputSubmissionStatus(
	token: string,
	submissionId: string,
): Promise<CustomInputResult> {
	const response = await fetch(
		`${getBridgeUrl()}/v1/input_submissions/${submissionId}`,
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
		},
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || `HTTP error! status: ${response.status}`,
		);
	}

	return response.json();
}

export async function postPublicCustomInputSubmission(
	code: string,
	languageId: string,
	stdin: string,
	options?: { benchmark?: boolean },
): Promise<string> {
	const endpoint = options?.benchmark
		? "/v1/bench/input_submissions"
		: "/v1/public/input_submissions";

	const response = await fetch(`${getBridgeUrl()}${endpoint}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			source_code: code,
			language_id: languageId,
			stdin: stdin,
		}),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		if (response.status === 429) {
			throw new Error("RATE_LIMIT_EXCEEDED");
		}
		throw new Error(
			errorData.message || `HTTP error! status: ${response.status}`,
		);
	}

	return response.text();
}

export async function getPublicCustomInputSubmissionStatus(
	submissionId: string,
	options?: { benchmark?: boolean },
): Promise<CustomInputResult> {
	const endpoint = options?.benchmark
		? "/v1/bench/input_submissions"
		: "/v1/public/input_submissions";

	const response = await fetch(`${getBridgeUrl()}${endpoint}/${submissionId}`, {
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || `HTTP error! status: ${response.status}`,
		);
	}

	return response.json();
}