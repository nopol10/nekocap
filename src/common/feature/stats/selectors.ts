import { RootState } from "@/common/store/types";

export const globalStatsSelector = (state: RootState) =>
  state.stats.globalStats;
