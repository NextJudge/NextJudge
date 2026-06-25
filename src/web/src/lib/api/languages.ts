import { Language } from "../types";
import { apiUrl } from "./client";

export async function apiGetLanguages(): Promise<Language[]> {
	try {
		const data = await fetch(apiUrl("/v1/languages"));
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
