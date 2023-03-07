import { getNekoCapWebsiteUrl } from "@/common/client-utils";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";
import { CaptionListFields } from "./types";
import { videoSourceToProcessorMap } from "./utils";

export const populateCaptionDetails = async (
  captions: CaptionListFields[]
): Promise<CaptionListFields[]> => {
  const updatedCaptions = await Promise.all(
    captions.map(async (caption) => {
      const processor =
        videoSourceToProcessorMap[parseInt(caption.videoSource)];
      if (!processor) {
        return caption;
      }
      const thumbnailUrl = await processor.generateThumbnailLink(
        caption.videoId
      );
      return {
        ...caption,
        thumbnailUrl,
      };
    })
  );
  return updatedCaptions;
};

export const loadFontListApi = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(getNekoCapWebsiteUrl() + "fontlist.json");
    let data: Record<string, string> = await response.json();
    data = Object.keys(data).reduce((acc, key) => {
      const fontPath = data[key];
      if (fontPath.startsWith("/")) {
        acc[key] =
          process.env.NEXT_PUBLIC_FONTS_URL.replace(/\/+$/, "") + fontPath;
      } else {
        acc[key] = fontPath;
      }

      return acc;
    }, {});
    return data;
  } catch (e) {
    return SUBSTATION_FONT_LIST;
  }
};
