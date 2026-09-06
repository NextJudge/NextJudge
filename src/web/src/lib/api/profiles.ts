import {
	parsePublicProfile,
	type PublicProfileSchema,
} from "../schemas/profile";
import { apiFetchParsed } from "./client";

export type PublicProfile = PublicProfileSchema;

export async function apiGetPublicProfile(
	handle: string,
): Promise<PublicProfile> {
	return apiFetchParsed(
		`/v1/profiles/${encodeURIComponent(handle)}`,
		parsePublicProfile,
	);
}
