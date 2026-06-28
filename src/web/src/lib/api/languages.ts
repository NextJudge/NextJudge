import { Language } from "../types";
import { parseLanguageList } from "../schemas/submission";
import { apiUrl } from "./client";

const fallbackLanguages: Language[] = [{
	id: "typescript-fallback",
	name: "TypeScript",
	extension: "ts",
	version: "5.4.5",
}];

export async function apiGetLanguages(): Promise<Language[]> {
	try {
		const response = await fetch(apiUrl("/v1/languages"));
		if (!response.ok) {
			throw new Error(`Failed to fetch languages: ${response.status}`);
		}
		const json: unknown = await response.json();
		return parseLanguageList(json);
	} catch (error) {
		console.error("Failed to fetch languages:", error);
		return fallbackLanguages;
	}
}
