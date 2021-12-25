import { CaptionFileFormat } from "@/common/types";

export const MAX_CAPTION_FILE_BYTES = 2000000; // 2 MB
export const MAX_VERIFIED_CAPTION_FILE_BYTES = 100000000; // 100 MB
/**
 * Prevent the editor from being used if the file is more than this length
 * The editor doesn't support files that are too large right now.
 * ASS files with lots of effects will make the editor very unresponsive
 */
export const EDITOR_CUTOFF_BYTES = 800000; // 800 KB

export const VALID_FILE_TYPES = [
  CaptionFileFormat.srt,
  CaptionFileFormat.vtt,
  CaptionFileFormat.sbv,
  CaptionFileFormat.ssa,
  CaptionFileFormat.ass,
];

export const SUPPORTED_FILE_TYPES_STRING = VALID_FILE_TYPES.map((fileType) =>
  fileType.toUpperCase()
).join(", ");
