import type { ServerResponse } from "@/common/types";
import { CaptionListFields } from "../video/types";

export type GlobalStats = {
  totalViews: number;
  totalCaptions: number;
  totalViewsPerLanguage: { languageCode: string; views: number }[];
  totalCaptionsPerLanguage: { languageCode: string; count: number }[];
  topCaptionsAllTime: CaptionListFields[];
  topCaptionsUploadedThisMonth: CaptionListFields[];
};

export type StatsResponse = ServerResponse & {
  result?: GlobalStats;
};

export type StatsState = {
  globalStats: GlobalStats;
};

export type HomepageStats = {
  totalViews: number;
  totalCaptions: number;
  totalCaptioners: number;
  totalLanguages: number;
  totalSites: number;
  computedAt: string;
};
