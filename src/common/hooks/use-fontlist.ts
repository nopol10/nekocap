import { useQuery } from "@tanstack/react-query";
import { loadFontListApi } from "../feature/video/api";

export function useFontList() {
  return useQuery({
    queryKey: ["fontList"],
    queryFn: loadFontListApi,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });
}
