import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ProblemFormValues } from "@/lib/schemas/problem-form";

export const generateIdentifierFromTitle = (title: string): string =>
	title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

export const useAutoIdentifierFromTitle = (
	form: UseFormReturn<ProblemFormValues>,
) => {
	const titleValue = form.watch("title");
	const identifierValue = form.watch("identifier");

	useEffect(() => {
		if (!titleValue || identifierValue) {
			return;
		}

		const generatedIdentifier = generateIdentifierFromTitle(titleValue);
		if (generatedIdentifier) {
			form.setValue("identifier", generatedIdentifier);
		}
	}, [titleValue, identifierValue, form]);
};
