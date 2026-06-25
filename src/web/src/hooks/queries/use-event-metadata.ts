"use client";

import { apiGetEventProblems } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { NextJudgeEvent } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export function useEventMetadata(contest: NextJudgeEvent) {
  const { data: session } = useSession();
  const token = session?.nextjudge_token;
  const hasProblemCount =
    Boolean(contest.problem_count) || Boolean(contest.problems?.length);
  const hasParticipantCount =
    Boolean(contest.participant_count) ||
    Boolean(contest.participants?.length);

  const query = useQuery({
    queryKey: queryKeys.event.metadata(token ?? "", contest.id),
    queryFn: () => apiGetEventProblems(token!, contest.id),
    enabled: Boolean(token && contest.id && !hasProblemCount),
    staleTime: 60_000,
  });

  const problemCount =
    contest.problem_count ??
    contest.problems?.length ??
    query.data?.length ??
    0;

  const participantCount =
    contest.participant_count ?? contest.participants?.length ?? 0;

  return {
    problemCount,
    participantCount,
    loading: query.isLoading && !hasProblemCount,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
