"use client";

import {
  apiAddEventParticipant,
  apiEndEvent,
  apiGetEventAttempts,
  apiGetEventQuestions,
  apiGetEventSubmissions,
  apiGetEvents,
  apiGetProblems,
  apiGetUserEventProblemsStatus,
  apiRegisterForEvent,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminEvents(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.admin(token ?? ""),
    queryFn: () => apiGetEvents(token!),
    enabled: Boolean(token),
  });
}

export function useProblems(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.problems(token ?? ""),
    queryFn: () => apiGetProblems(token!),
    enabled: Boolean(token),
  });
}

export function useEventAttempts(
  token: string | undefined,
  eventId: number,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.event.attempts(token ?? "", eventId),
    queryFn: () => apiGetEventAttempts(token!, eventId),
    enabled: Boolean(token && eventId && enabled),
  });
}

export function useEventQuestions(
  token: string | undefined,
  eventId: number,
) {
  return useQuery({
    queryKey: queryKeys.event.questions(token ?? "", eventId),
    queryFn: () => apiGetEventQuestions(token!, eventId),
    enabled: Boolean(token && eventId),
  });
}

export function useEventSubmissions(
  token: string | undefined,
  eventId: number,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.event.submissions(token ?? "", eventId),
    queryFn: () => apiGetEventSubmissions(token!, eventId),
    enabled: Boolean(token && eventId && enabled),
  });
}

export function useUserEventProblemsStatus(
  token: string | undefined,
  eventId: number,
) {
  return useQuery({
    queryKey: queryKeys.event.userStatus(token ?? "", eventId),
    queryFn: () => apiGetUserEventProblemsStatus(token!, eventId),
    enabled: Boolean(token && eventId),
  });
}

export function useAddEventParticipant(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      userId,
    }: {
      eventId: number;
      userId: string;
    }) => apiAddEventParticipant(token!, eventId, userId),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.public(token ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.event.metadata(token ?? "", eventId),
      });
    },
  });
}

export function useRegisterForEvent(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => apiRegisterForEvent(token!, eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.public(token ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.event.metadata(token ?? "", eventId),
      });
    },
  });
}

export function useEndEvent(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => apiEndEvent(token!, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.admin(token ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.public(token ?? ""),
      });
    },
  });
}
