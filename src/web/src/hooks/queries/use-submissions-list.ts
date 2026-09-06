"use client";

import { apiListSubmissions, type SubmissionListParams } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { SubmissionStatus } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

export type SubmissionListFilters = {
	status?: SubmissionStatus;
	problemId?: number;
	languageId?: string;
};

const toListParams = (
	filters: SubmissionListFilters,
	cursor?: string,
): SubmissionListParams => ({
	cursor,
	status: filters.status,
	problem_id: filters.problemId,
	language_id: filters.languageId,
	limit: 25,
});

export function useSubmissionsList(
	token: string | undefined,
	filters: SubmissionListFilters,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.submissions.list(token ?? "", {
			status: filters.status,
			problemId: filters.problemId,
			languageId: filters.languageId,
		}),
		queryFn: ({ pageParam }) =>
			apiListSubmissions(token!, toListParams(filters, pageParam)),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
		enabled: Boolean(token),
	});
}
