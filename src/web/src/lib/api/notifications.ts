import { Notification, NotificationCount } from "../types";
import { apiFetch, apiFetchJson, authHeaders } from "./client";

export async function apiGetNotificationsCount(
	token: string,
): Promise<NotificationCount> {
	return apiFetchJson("/v1/user/notifications/count", {
		headers: authHeaders(token),
	});
}

export async function apiGetUserNotifications(
	token: string,
): Promise<Notification[]> {
	return apiFetchJson("/v1/user/notifications", {
		headers: authHeaders(token),
	});
}

export async function apiMarkNotificationsAsRead(
	token: string,
): Promise<void> {
	await apiFetch("/v1/user/notifications/mark-read", {
		method: "PUT",
		headers: authHeaders(token),
	});
}
