import { apiFetchJson, jsonAuthHeaders } from "./client";

export type OrgRole = "owner" | "admin" | "instructor" | "member";
export type ClassRole = "instructor" | "ta" | "student";
export type AssignmentLatePolicy = "none" | "allow_late" | "penalty_per_day";

export interface Organization {
	id: string;
	slug: string;
	name: string;
	description: string;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

export interface OrgMember {
	id: string;
	organization_id: string;
	user_id: string;
	role: OrgRole;
	created_at: string;
	user?: {
		id: string;
		name: string;
		email: string;
	};
}

export interface ClassRoom {
	id: string;
	organization_id: string;
	name: string;
	description: string;
	term: string;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

export interface ClassMember {
	id: string;
	class_id: string;
	user_id: string;
	role: ClassRole;
	created_at: string;
	user?: {
		id: string;
		name: string;
		email: string;
	};
}

export interface Assignment {
	id: string;
	class_id: string;
	revision_id: string;
	title: string;
	description: string;
	due_at?: string;
	late_policy: AssignmentLatePolicy;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

export interface RosterImportResult {
	added: number;
	skipped: number;
	errors: string[];
}

export const apiGetOrganizations = async (
	token: string,
): Promise<Organization[]> =>
	apiFetchJson<Organization[]>("/v1/organizations", {
		headers: jsonAuthHeaders(token),
	});

export const apiCreateOrganization = async (
	token: string,
	body: { slug: string; name: string; description?: string },
): Promise<Organization> =>
	apiFetchJson<Organization>("/v1/organizations", {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(body),
	});

export const apiDeleteOrganization = async (
	token: string,
	orgId: string,
): Promise<void> => {
	await apiFetchJson<void>(`/v1/organizations/${orgId}`, {
		method: "DELETE",
		headers: jsonAuthHeaders(token),
	});
};

export const apiGetOrganizationClasses = async (
	token: string,
	orgId: string,
): Promise<ClassRoom[]> =>
	apiFetchJson<ClassRoom[]>(`/v1/organizations/${orgId}/classes`, {
		headers: jsonAuthHeaders(token),
	});

export const apiCreateClass = async (
	token: string,
	orgId: string,
	body: { name: string; description?: string; term?: string },
): Promise<ClassRoom> =>
	apiFetchJson<ClassRoom>(`/v1/organizations/${orgId}/classes`, {
		method: "POST",
		headers: jsonAuthHeaders(token),
		body: JSON.stringify(body),
	});

export const apiImportClassRoster = async (
	token: string,
	classId: string,
	csv: string,
): Promise<RosterImportResult> =>
	apiFetchJson<RosterImportResult>(
		`/v1/classes/${classId}/roster/import`,
		{
			method: "POST",
			headers: {
				Authorization: token,
				"Content-Type": "text/csv",
			},
			body: csv,
		},
	);
