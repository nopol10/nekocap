import { decompressFromBase64 as lzDecompress } from "lz-string";
import {
  CaptionRendererType,
  RawCaptionData,
} from "@/common/feature/video/types";
import { Locator } from "@/common/locator/locator";
import { CaptionFileFormat } from "@/common/types";

export const loadWebsiteViewerCaptionApi = async (captionId: string) => {
  const response = await Locator.provider().loadCaption({
    captionId,
  });

  const { caption, rawCaption: rawCaptionString } = response;
  let rawCaption: RawCaptionData | null = null;
  if (rawCaptionString) {
    rawCaption = JSON.parse(rawCaptionString);
    if (rawCaption && rawCaption.data) {
      if (rawCaption.data) {
        const decompressedRawCaption = lzDecompress(rawCaption.data);
        if (decompressedRawCaption) {
          rawCaption.data = decompressedRawCaption;
        }
      }
    }
  }

  let defaultRenderer: CaptionRendererType = CaptionRendererType.Default;
  if (
    rawCaption &&
    (rawCaption.type === CaptionFileFormat.ass ||
      rawCaption.type === CaptionFileFormat.ssa)
  ) {
    // The user has to manually initiate the conversion as a large ass will freeze the page
    // Other file formats don't support fancy effects so we'll allow them to be auto converted
    defaultRenderer = CaptionRendererType.AdvancedOctopus;
  }

  return { caption, rawCaption, renderer: defaultRenderer };
};
