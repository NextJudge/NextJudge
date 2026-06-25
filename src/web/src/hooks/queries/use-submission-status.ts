"use client";

import {
  apiGetSubmissionStatusPoll,
  apiGetSubmissionsStatus,
  getCustomInputSubmissionStatus,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { SubmissionStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useSubmissionStatus(
  token: string | undefined,
  submissionId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.submissions.status(token ?? "", submissionId ?? ""),
    queryFn: async () => {
      const poll = await apiGetSubmissionStatusPoll(token!, submissionId!);
      if (poll.status === "PENDING") {
        return poll;
      }
      return apiGetSubmissionsStatus(token!, submissionId!);
    },
    enabled: Boolean(token && submissionId && enabled),
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 1000 : false,
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
      return !data.finished && data.status === "PENDING" ? 500 : false;
    },
  });
}

export function isSubmissionPending(status: SubmissionStatus | undefined) {
  return status === "PENDING";
}
