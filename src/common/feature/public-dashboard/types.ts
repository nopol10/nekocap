import { CaptionListFields, VideoSource } from "../video/types";

export type PublicDashboardState = {
  latestCaptions: CaptionListFields[];
  latestUserLanguageCaptions: CaptionListFields[];
  popularCaptions: CaptionListFields[];
};
