import { parseCaption } from "@/common/caption-parsers";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { isAss } from "@/common/caption-utils";
import { chromeProm } from "@/common/chrome-utils";
import { isInExtension } from "@/common/client-utils";
import { EditorStorage } from "@/common/feature/caption-editor/types";
import { RawCaptionData, VideoSource } from "@/common/feature/video/types";
import { CaptionFileFormat } from "@/common/types";
import { compressToBase64 as lzCompress } from "lz-string";

export const EDITOR_STORAGE_KEY = "editor";

export async function hasSaveData(
  videoId: string,
  videoSource: VideoSource,
): Promise<boolean> {
  const result = await getLocalCaptionDataFromStorage();
  if (!result || !result.editor) {
    return false;
  }
  const { saves = [] } = result.editor;
  const save = saves.find((save) => {
    return save.videoId === videoId && save.videoSource === videoSource;
  });
  return !!save;
}

export async function getLocalCaptionDataFromStorage() {
  let result: EditorStorage | undefined;

  if (isInExtension()) {
    result = await chromeProm.storage.local.get([EDITOR_STORAGE_KEY]);
  } else {
    result =
      JSON.parse(
        globalThis.localStorage.getItem(EDITOR_STORAGE_KEY) || "null",
      ) || undefined;
  }
  return result;
}

export async function saveLocalCaptionDataToStorage(result: EditorStorage) {
  if (isInExtension()) {
    await chromeProm.storage.local.setByAppending([EDITOR_STORAGE_KEY], result);
  } else {
    globalThis.localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(result));
  }
}

/**
 * Prepares a raw caption for submission to the server.
 * Captions without raw data (anything written in the editor and any non ass
 * file) must not send a raw caption at all: the server would try to store an
 * empty raw file, which the file upload endpoint rejects.
 * The data is compressed here and decompressed on retrieval.
 */
export function compressRawCaptionForUpload(
  rawCaption?: RawCaptionData,
): RawCaptionData | undefined {
  if (!rawCaption || !rawCaption.data) {
    return undefined;
  }
  return { ...rawCaption, data: lzCompress(rawCaption.data) };
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
