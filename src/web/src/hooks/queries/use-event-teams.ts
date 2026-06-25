"use client";

import {
  apiCreateEventTeam,
  apiGetEventTeams,
  apiGetMyEventTeam,
  apiJoinEventTeam,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useEventTeams(token: string | undefined, eventId: number) {
  return useQuery({
    queryKey: queryKeys.event.teams(token ?? "", eventId),
    queryFn: () => apiGetEventTeams(token!, eventId),
    enabled: Boolean(token && eventId),
  });
}

export function useMyEventTeam(
  token: string | undefined,
  eventId: number,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.event.myTeam(token ?? "", eventId),
    queryFn: () => apiGetMyEventTeam(token!, eventId),
    enabled: Boolean(token && eventId && enabled),
    retry: false,
  });
}

export function useTeamMutations(token: string | undefined, eventId: number) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.event.teams(token ?? "", eventId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.event.myTeam(token ?? "", eventId),
    });
  };

  const createTeam = useMutation({
    mutationFn: (name: string) => apiCreateEventTeam(token!, eventId, name),
    onSuccess: invalidate,
  });

  const joinTeam = useMutation({
    mutationFn: (teamId: string) =>
      apiJoinEventTeam(token!, eventId, teamId),
    onSuccess: invalidate,
  });

  return { createTeam, joinTeam };
}
