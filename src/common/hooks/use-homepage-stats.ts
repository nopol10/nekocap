import { useQuery } from "@tanstack/react-query";
import { loadHomepageStatsApi } from "../feature/stats/api";

export function useHomepageStats() {
  return useQuery({
    queryKey: ["homepageStats"],
    queryFn: loadHomepageStatsApi,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
