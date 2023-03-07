import { Locator } from "@/common/locator/locator";
import { BROWSE_PAGE_SIZE } from "@/web/feature/browse/containers/browse-caption-page";
import { CaptionsResponse } from "../captioner/types";
import { populateCaptionDetails } from "../video/api";
import { BrowseResults } from "./types";

export const loadLatestCaptionsApi = async () => {
  const { captions, status, error }: CaptionsResponse =
    await Locator.provider().loadLatestCaptions();
  if (status !== "success") {
    throw new Error(error);
  }

  const captionsWithDetails = await populateCaptionDetails(captions);

  return captionsWithDetails;
};

export const loadBrowseCaptions = async (pageNumber: number) => {
  const { status, error, captions, hasMoreResults, totalCount }: BrowseResults =
    await Locator.provider().browse({
      limit: BROWSE_PAGE_SIZE,
      offset: (pageNumber - 1) * BROWSE_PAGE_SIZE,
    });
  const captionsWithDetails = await populateCaptionDetails(captions);

  if (status === "error") {
    throw new Error(error);
  }
  return {
    captions: captionsWithDetails,
    hasMoreResults,
    totalCount,
  };
};
