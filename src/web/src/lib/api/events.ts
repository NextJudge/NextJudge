import {
	AnswerQuestionRequest,
	CreateEventRequest,
	CreateQuestionRequest,
	CreateTeamResponse,
	EventQuestion,
	EventTeam,
	NextJudgeEvent,
	Problem,
	Submission,
	User,
} from "../types";
import { apiFetch, apiFetchJson, apiUrl, authHeaders, jsonAuthHeaders, parseApiError } from "./client";

export async function apiGetEvents(token: string): Promise<NextJudgeEvent[]> {
	return apiFetchJson("/v1/events", { headers: authHeaders(token) });
}

export async function apiGetPublicEvents(
	token: string,
): Promise<NextJudgeEvent[]> {
	return apiFetchJson("/v1/public/events", { headers: authHeaders(token) });
}

export async function apiCreateEvent(
	token: string,
	data: CreateEventRequest,
): Promise<NextJudgeEvent> {
	return apiFetchJson("/v1/events", {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(data),
	});
}

export async function apiUpdateEvent(
	token: string,
	id: number,
	data: Partial<CreateEventRequest>,
): Promise<NextJudgeEvent> {
	return apiFetchJson(`/v1/events/${id}`, {
		method: "PUT",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(data),
	});
}

export async function apiEndEvent(
	token: string,
	eventId: number,
): Promise<void> {
	await apiFetch(`/v1/events/${eventId}/end`, {
		method: "POST",
		headers: authHeaders(token),
	});
}

export async function apiDeleteEvent(
	token: string,
	id: number,
): Promise<void> {
	await apiFetch(`/v1/events/${id}`, {
		method: "DELETE",
		headers: authHeaders(token),
	});
}

export async function apiGetEvent(
	token: string,
	id: number,
): Promise<NextJudgeEvent> {
	return apiFetchJson(`/v1/events/${id}`, { headers: authHeaders(token) });
}

export async function apiAddEventParticipant(
	token: string,
	eventId: number,
	userId: string,
): Promise<void> {
	await apiFetch(`/v1/events/${eventId}/participants`, {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify({ user_id: userId }),
	});
}

export async function apiRegisterForEvent(
	token: string,
	eventId: number,
): Promise<void> {
	await apiFetch(`/v1/public/events/${eventId}/register`, {
		method: "POST",
		headers: authHeaders(token),
	});
}

export async function apiGetEventTeams(
	token: string,
	eventId: number,
): Promise<EventTeam[]> {
	return apiFetchJson(`/v1/events/${eventId}/teams`, {
		headers: authHeaders(token),
	});
}

export async function apiGetMyEventTeam(
	token: string,
	eventId: number,
): Promise<EventTeam | null> {
	const response = await fetch(apiUrl(`/v1/events/${eventId}/teams/me`), {
		headers: authHeaders(token),
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		await parseApiError(response);
	}

	return response.json();
}

export async function apiGetEventTeam(
	token: string,
	eventId: number,
	teamId: string,
): Promise<EventTeam> {
	return apiFetchJson(`/v1/events/${eventId}/teams/${teamId}`, {
		headers: authHeaders(token),
	});
}

export async function apiCreateEventTeam(
	token: string,
	eventId: number,
	name: string,
): Promise<CreateTeamResponse> {
	return apiFetchJson(`/v1/events/${eventId}/teams`, {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify({ name }),
	});
}

export async function apiJoinEventTeam(
	token: string,
	eventId: number,
	teamId: string,
	userId?: string,
): Promise<void> {
	await apiFetch(`/v1/events/${eventId}/teams/${teamId}/join`, {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify({ user_id: userId }),
	});
}

export async function apiGetEventWithDetails(
	token: string,
	eventId: number,
): Promise<NextJudgeEvent> {
	return apiFetchJson(`/v1/public/events/${eventId}`, {
		headers: authHeaders(token),
	});
}

export async function apiGetEventProblems(
	token: string,
	eventId: number,
): Promise<Problem[]> {
	return apiFetchJson(`/v1/events/${eventId}/problems`, {
		headers: authHeaders(token),
	});
}

export async function apiGetEventParticipants(
	token: string,
	eventId: number,
): Promise<User[]> {
	return apiFetchJson(`/v1/public/events/${eventId}/participants`, {
		headers: authHeaders(token),
	});
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
	return apiFetchJson(`/v1/events/${eventId}/problems_stats`, {
		headers: authHeaders(token),
	});
}

export async function apiGetUserEventProblemsStatus(
	token: string,
	eventId: number,
): Promise<UserEventProblemStatus[]> {
	return apiFetchJson(`/v1/events/${eventId}/user_problem_status`, {
		headers: authHeaders(token),
	});
}

export async function apiGetEventSubmissions(
	token: string,
	eventId: number,
): Promise<Submission[]> {
	return apiFetchJson(`/v1/events/${eventId}/submissions`, {
		headers: authHeaders(token),
	});
}

export interface EventProblemAttemptDTO {
	user_id: string;
	problem_id: number;
	attempts: number;
	total_attempts: number;
	first_accepted_time?: string;
	minutes_to_solve?: number;
}

export async function apiGetEventAttempts(
	token: string,
	eventId: number,
): Promise<EventProblemAttemptDTO[]> {
	return apiFetchJson(`/v1/events/${eventId}/attempts`, {
		headers: authHeaders(token),
	});
}

export async function apiGetEventQuestions(
	token: string,
	eventId: number,
): Promise<EventQuestion[]> {
	return apiFetchJson(`/v1/events/${eventId}/questions`, {
		headers: authHeaders(token),
	});
}

export async function apiCreateEventQuestion(
	token: string,
	eventId: number,
	questionData: CreateQuestionRequest,
): Promise<EventQuestion> {
	return apiFetchJson(`/v1/events/${eventId}/questions`, {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(questionData),
	});
}

export async function apiAnswerEventQuestion(
	token: string,
	eventId: number,
	questionId: string,
	answerData: AnswerQuestionRequest,
): Promise<void> {
	await apiFetch(
		`/v1/events/${eventId}/questions/${questionId}/answer`,
		{
			method: "PUT",
			headers: jsonAuthHeaders(token),
			body: JSON.stringify(answerData),
		},
	);
}
