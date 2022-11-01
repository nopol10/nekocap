import { Captions, parse, stringify as stringifySrt } from "subtitle";
import { parseSBV } from "./sbv-parser";
import { NekoCaption, CaptionDataContainer, Track } from "./types";
import { compile as compileAss, CompiledASS, Dialogue } from "ass-compiler";
import { CaptionFileFormat, Coords } from "../types";
import { isRTLString } from "../utils";
import { parseTxt } from "./txt-parser";

// #region Parse
const convertSrtCaptionsToNekoCaptionData = (
  captions: Captions
): CaptionDataContainer => {
  return {
    tracks: [
      {
        cues: captions.map((caption) => {
          return {
            start: caption.start,
            end: caption.end,
            text: caption.text,
          };
        }),
      },
    ],
  };
};

const convertAssCaptionsToNekoCaptionData = (
  compiledAss: CompiledASS
): CaptionDataContainer => {
  const dialogues: Dialogue[] = compiledAss.dialogues || [];
  const size: Coords = {
    x: parseInt(compiledAss.info.PlayResX),
    y: parseInt(compiledAss.info.PlayResY),
  };
  const tracks: Track[] = [];
  dialogues.forEach((dialogue) => {
    const text = dialogue.slices.reduce((acc, slice) => {
      return (
        acc +
        slice.fragments.reduce((frAcc, fragment) => {
          let { text } = fragment;
          text = text.replace("\\N", "\n");
          return frAcc + text;
        }, "")
      );
    }, "");
    const position = dialogue.pos
      ? {
          x: dialogue.pos.x / size.x,
          y: dialogue.pos.y / size.y,
        }
      : undefined;
    const trackId = dialogue.layer;
    if (trackId >= tracks.length) {
      // Add enough new tracks
      tracks.push(
        ...Array<Track>(trackId - tracks.length + 1).fill({ cues: [] })
      );
    }
    tracks[trackId].cues.push({
      start: dialogue.start * 1000,
      end: dialogue.end * 1000,
      text: text,
      layout: {
        alignment: dialogue.alignment,
        position,
      },
    });
  });
  // Sort each track as we cannot be sure that the events are in chronological order
  tracks.forEach((track) => {
    track.cues.sort((a, b) => {
      return a.start - b.start;
    });
  });

  return {
    tracks,
  };
};

export const parseCaption = (
  fileType: string,
  content: string
): CaptionDataContainer => {
  switch (fileType.toLowerCase()) {
    case CaptionFileFormat.srt:
    case CaptionFileFormat.vtt:
      return convertSrtCaptionsToNekoCaptionData(parse(content));
    case CaptionFileFormat.sbv:
      return parseSBV(content);
    case CaptionFileFormat.txt:
      return parseTxt(content);
    case CaptionFileFormat.ass:
    case CaptionFileFormat.ssa:
      return convertAssCaptionsToNekoCaptionData(compileAss(content, {}));
    default:
      return { tracks: [] };
  }
};

// #endregion

// #region Stringify
/**
 * Returns a caption data container with a single track
 * This removes all track settings
 * @param caption
 */
const flattenNekoCaption = (caption: CaptionDataContainer) => {
  const newCaption = { ...caption };
  const trackCaptions = caption.tracks
    .reduce<NekoCaption[]>((acc, track) => {
      return acc.concat(track.cues);
    }, [])
    .sort((a, b) => a.start - b.start);
  newCaption.tracks = [
    {
      cues: trackCaptions,
      settings: newCaption.tracks[0]?.settings,
    },
  ];
  return newCaption;
};

const stringifyNekoToSrt = (captionContainer: CaptionDataContainer) => {
  return stringifySrt(
    flattenNekoCaption(captionContainer).tracks[0].cues.map((caption) => {
      let text = caption.text;
      // RTL is only checked here instead of when the text is updated so that if the user
      // loads a file, makes no changes and exports, the text's RTL will still be updated correctly
      if (isRTLString(text)) {
        text = text.replace(/\u202B/g, "");
        text = "\u202B" + text + "\u202C";
      }
      return {
        start: Math.floor(caption.start),
        end: Math.floor(caption.end),
        text,
      };
    })
  );
};

export const stringifyCaption = (
  format: keyof typeof CaptionFileFormat,
  caption: CaptionDataContainer
): string => {
  switch (format) {
    case "srt":
      return stringifyNekoToSrt(caption);
    default:
      return "";
  }
};

// #endregion
