"use client";

import { apiGetLanguages } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useLanguages() {
  return useQuery({
    queryKey: queryKeys.languages,
    queryFn: apiGetLanguages,
    staleTime: 5 * 60_000,
  });
}
