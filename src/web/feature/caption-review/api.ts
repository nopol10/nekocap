import { Locator } from "@/common/locator/locator";

export const loadCaptionForReviewApi = async (captionId: string) => {
  const caption = await Locator.provider().loadCaptionForReview({
    captionId,
  });

  return caption;
};
