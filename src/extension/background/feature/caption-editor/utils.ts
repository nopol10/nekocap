import { chromeProm } from "@/common/chrome-utils";
import {
  CaptionEditorLocalSave,
  CaptionEditorStorage,
} from "@/common/feature/caption-editor/types";
import { VideoSource } from "@/common/feature/video/types";

export async function hasSaveData(
  videoId: string,
  videoSource: VideoSource
): Promise<boolean> {
  const result:
    | { editor: CaptionEditorStorage }
    | undefined = await chromeProm.storage.local.get(["editor"]);
  if (!result) {
    return false;
  }
  const { saves = [] } = result.editor;
  const save: CaptionEditorLocalSave | undefined = saves.find((save) => {
    return save.videoId === videoId && save.videoSource === videoSource;
  });
  return !!save;
}
