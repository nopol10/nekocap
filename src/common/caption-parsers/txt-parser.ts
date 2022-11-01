import { NekoCaption, CaptionDataContainer } from "./types";

const DEFAULT_CUE_DURATION_MILLISECONDS = 1000;
const emptyCaption = { start: -1, end: -1, text: "" };

/**
 * Turn each line in a text file into a caption cue
 */
export function parseTxt(txtContent: string): CaptionDataContainer {
  const captions = txtContent.split(/\r?\n/).map((c) => c.trim());
  const parsed: NekoCaption[] = captions
    .map((caption, index) => {
      const currentCaption: NekoCaption = { ...emptyCaption };
      try {
        currentCaption.start = index * DEFAULT_CUE_DURATION_MILLISECONDS;
        currentCaption.end =
          (index + 1) * DEFAULT_CUE_DURATION_MILLISECONDS - 1;
        currentCaption.text = caption;
      } catch (e) {
        console.error("Error parsing caption ", index);
      }
      return currentCaption;
    })
    .filter((caption) => caption.start >= 0 && caption.end >= 0);
  return { tracks: [{ cues: parsed }] };
}
