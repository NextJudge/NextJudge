"use client";

import {
  apiGetNotificationsCount,
  apiGetUserNotifications,
  apiMarkNotificationsAsRead,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotifications(token: string | undefined) {
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: queryKeys.notifications.count(token ?? ""),
    queryFn: () => apiGetNotificationsCount(token!),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list(token ?? ""),
    queryFn: () => apiGetUserNotifications(token!),
    enabled: Boolean(token),
  });

  const markReadMutation = useMutation({
    mutationFn: () => apiMarkNotificationsAsRead(token!),
    onSuccess: () => {
      queryClient.setQueryData(
        queryKeys.notifications.count(token ?? ""),
        { count: 0 },
      );
      queryClient.setQueryData(
        queryKeys.notifications.list(token ?? ""),
        (prev: Awaited<ReturnType<typeof apiGetUserNotifications>> | undefined) =>
          prev?.map((n) => ({ ...n, is_read: true })) ?? [],
      );
    },
  });

  const refetch = async () => {
    await Promise.all([countQuery.refetch(), listQuery.refetch()]);
  };

  return {
    count: countQuery.data?.count ?? 0,
    notifications: listQuery.data ?? [],
    isLoading: listQuery.isLoading || countQuery.isLoading,
    refetch,
    markAllRead: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
  };
}
