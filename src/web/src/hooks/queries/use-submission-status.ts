"use client";

import {
  apiGetSubmissionStatusPoll,
  apiGetSubmissionsStatus,
  getCustomInputSubmissionStatus,
  type SubmissionStatusPoll,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { isCustomInputPending } from "@/lib/schemas/custom-input";
import { Submission, SubmissionStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type SubmissionQueryResult = SubmissionStatusPoll | Submission;

export function isPendingSubmissionPoll(
  data: SubmissionQueryResult,
): data is SubmissionStatusPoll {
  return data.status === "PENDING" && !("source_code" in data);
}

export function isCompletedSubmission(
  data: SubmissionQueryResult,
): data is Submission {
  return "source_code" in data;
}

export function useSubmissionStatus(
  token: string | undefined,
  submissionId: string | null,
  enabled = true,
) {
  return useQuery<SubmissionQueryResult>({
    queryKey: queryKeys.submissions.status(token ?? "", submissionId ?? ""),
    queryFn: async (): Promise<SubmissionQueryResult> => {
      const poll = await apiGetSubmissionStatusPoll(token!, submissionId!);
      if (poll.status === "PENDING") {
        return poll;
      }
      return apiGetSubmissionsStatus(token!, submissionId!);
    },
    enabled: Boolean(token && submissionId && enabled),
    refetchInterval: (query) =>
      query.state.data && isPendingSubmissionPoll(query.state.data) ? 1000 : false,
  });
}

export function useCustomInputStatus(
  token: string | undefined,
  runId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.submissions.customInput(token ?? "", runId ?? ""),
    queryFn: () => getCustomInputSubmissionStatus(token!, runId!),
    enabled: Boolean(token && runId && enabled),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 500;
      return isCustomInputPending(data) ? 500 : false;
    },
  });
}

export function isSubmissionPending(status: SubmissionStatus | undefined) {
  return status === "PENDING";
}
