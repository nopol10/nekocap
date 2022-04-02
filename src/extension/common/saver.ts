import { saveAs } from "file-saver";
import { ExportCaptionResult } from "@/common/feature/caption-editor/types";

export function saveCaptionToDisk(options: ExportCaptionResult): void {
  const { captionString, filename } = options;
  const blob = new Blob([captionString], {
    type: "text/plain;charset=utf-8",
  });
  saveAs(blob, filename);
}
