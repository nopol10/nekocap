import { OffsetRequest, PagedType, ServerResponse } from "@/common/types";
import {
  CaptionListFields,
  LoadCaptionsResult,
  VideoFields,
  VideoSource,
} from "../video/types";

export type SearchState = {
  currentResultPage: number;
  totalResults: number;
  searchString: string | null;
  videoLanguageCode: string | null;
  captionLanguageCode: string | null;
  captions: LoadCaptionsResult[];
  videos: VideoFields[];
  hasMoreResults: boolean;
};

export type SearchFields = {
  title: string;
  videoLanguageCode?: string;
  captionLanguageCode?: string;
};

export type SearchParams = PagedType &
  SearchFields & {
    append?: boolean; // whether the results should be appended
  };

export type LoadSearchResultVideoCaptions = {
  videoId: string;
  videoSource: VideoSource;
};

export type SearchRequest = OffsetRequest & SearchFields;

export type SearchResults = ServerResponse & {
  captions: CaptionListFields[];
};

export type VideoSearchResults = ServerResponse & {
  videos: VideoFields[];
  hasMoreResults: boolean;
};

export type SetVideoSearchResults = {
  searchString: string;
  videoLanguageCode?: string;
  captionLanguageCode?: string;
  videos: VideoFields[];
  hasMoreResults: boolean;
  currentResultPage: number;
  append: boolean;
};

export type SetSearchResultVideoCaptions = {
  captions: LoadCaptionsResult[];
};
