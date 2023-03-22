import { parseCaption } from "@/common/caption-parsers";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { isAss } from "@/common/caption-utils";
import { chromeProm } from "@/common/chrome-utils";
import {
  CaptionEditorLocalSave,
  CaptionEditorStorage,
} from "@/common/feature/caption-editor/types";
import { RawCaptionData, VideoSource } from "@/common/feature/video/types";
import { CaptionFileFormat } from "@/common/types";

export async function hasSaveData(
  videoId: string,
  videoSource: VideoSource
): Promise<boolean> {
  const result: { editor: CaptionEditorStorage } | undefined =
    await chromeProm.storage.local.get(["editor"]);
  if (!result || !result.editor) {
    return false;
  }
  const { saves = [] } = result.editor;
  const save: CaptionEditorLocalSave | undefined = saves.find((save) => {
    return save.videoId === videoId && save.videoSource === videoSource;
  });
  return !!save;
}

export function getCaptionContainersFromFile({
  content,
  type,
}: {
  content: string;
  type: string;
}): {
  rawCaptionData?: RawCaptionData;
  captionData: CaptionDataContainer;
} {
  const format: keyof typeof CaptionFileFormat | undefined =
    CaptionFileFormat[type];
  let rawCaptionData: RawCaptionData | undefined = undefined;
  let canAutoConvertToNekoCaption = true;
  if (format) {
    if (isAss(type)) {
      rawCaptionData = {
        data: content,
        type: format,
      };
      // The user has to manually initiate the conversion as a large ass will freeze the page
      // Other file formats don't support fancy effects so we'll allow them to be auto converted
      canAutoConvertToNekoCaption = false;
    }
  }

  let captionData: CaptionDataContainer = { tracks: [] };
  if (canAutoConvertToNekoCaption) {
    captionData = parseCaption(type, content);
  }
  return {
    rawCaptionData,
    captionData,
  };
}
