import { Notification, NotificationCount } from "../types";
import {
	parseNotificationCount,
	parseNotificationList,
} from "../schemas/notification";
import { apiFetch, apiFetchParsed, authHeaders } from "./client";

export async function apiGetNotificationsCount(
	token: string,
): Promise<NotificationCount> {
	return apiFetchParsed(
		"/v1/user/notifications/count",
		parseNotificationCount,
		{ headers: authHeaders(token) },
	);
}

export async function apiGetUserNotifications(
	token: string,
): Promise<Notification[]> {
	return apiFetchParsed(
		"/v1/user/notifications",
		parseNotificationList,
		{ headers: authHeaders(token) },
	);
}

export async function apiMarkNotificationsAsRead(
	token: string,
): Promise<void> {
	await apiFetch("/v1/user/notifications/mark-read", {
		method: "PUT",
		headers: authHeaders(token),
	});
}
