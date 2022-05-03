import { OffsetRequest, PagedType, ServerResponse } from "@/common/types";
import { CaptionListFields } from "../video/types";

export type PublicDashboardState = {
  latestCaptions: CaptionListFields[];
  latestUserLanguageCaptions: CaptionListFields[];
  popularCaptions: CaptionListFields[];
  // Browse related fields
  browseResults: CaptionListFields[];
  currentResultPage: number;
  totalResults: number;
  hasMoreResults: boolean;
};

export type BrowseParams = PagedType & {
  append?: boolean; // whether the results should be appended
};

export type SetBrowseResults = {
  captions: CaptionListFields[];
  hasMoreResults: boolean;
  currentResultPage: number;
  pageSize: number;
  append: boolean;
};

export type BrowseRequest = OffsetRequest;

export type BrowseResults = ServerResponse & {
  captions: CaptionListFields[];
  hasMoreResults: boolean;
  totalCount?: number;
};
