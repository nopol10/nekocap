import { NekoCaption, CaptionDataContainer } from "./types";

const sbvTimestampLineRegex = /^([\d]:[\d]{2}:[\d]{2}\.[\d]{3}),([\d]:[\d]{2}:[\d]{2}\.[\d]{3})$/;
const sbvTimestampRegex = /^([\d]):([\d]{2}):([\d]{2})\.([\d]{3})$/;

type TimestampPair = {
  start: number;
  end: number;
};

function parseSBVTimestamp(timestamp: string): number {
  const match = timestamp.match(sbvTimestampRegex);
  if (!match) {
    throw new Error("Invalid SBV timestamp format");
  }
  return (
    parseInt(match[1]) * 3600000 + // Hours
    parseInt(match[2]) * 60000 + // Minutes
    parseInt(match[3]) * 1000 + // Seconds
    parseInt(match[4])
  ); // Milliseconds
}

function parseSBVTimestampLine(line: string): TimestampPair {
  const match = line.match(sbvTimestampLineRegex);
  if (!match) {
    throw new Error("Invalid SBV timestamp line format");
  }
  const start = parseSBVTimestamp(match[1]);
  const end = parseSBVTimestamp(match[2]);
  return { start, end };
}

const emptyCaption = { start: -1, end: -1, text: "" };

/**
 * Good to know: When exporting to SBV, make sure that any empty lines within a single caption is replaced with a space
 * so that it does not get split into 2 different captions
 */
export function parseSBV(sbvContent: string): CaptionDataContainer {
  const captions = sbvContent.split(/\r?\n\r?\n/).map((c) => c.trim());
  const parsed: NekoCaption[] = captions
    .map((caption, index) => {
      const currentCaption: NekoCaption = { ...emptyCaption };
      const lines = caption.split(/\r?\n/);
      const timestampLine = lines[0];
      try {
        const { start, end } = parseSBVTimestampLine(timestampLine);
        currentCaption.start = start;
        currentCaption.end = end;
        currentCaption.text = lines.slice(1).join("\n");
      } catch (e) {
        console.error("Error parsing caption ", index);
      }
      return currentCaption;
    })
    .filter((caption) => caption.start >= 0 && caption.end >= 0);
  return { tracks: [{ cues: parsed }] };
}
