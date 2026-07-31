import type {
  CaptionDataContainer,
  Track,
} from "@/common/caption-parsers/types";
import { MAX_TRACKS } from "@/common/feature/video/constants";
import { CaptionContainer, VideoSource } from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";

/**
 * Caps to keep decoding and validation of untrusted preview payloads fast.
 * ~2 million base64 characters is roughly 1.5 MB of decoded JSON.
 */
export const MAX_PREVIEW_BASE64_LENGTH = 2_000_000;
export const MAX_PREVIEW_TOTAL_CUES = 20_000;

export enum PreviewCaptionError {
  TooLarge = "tooLarge",
  InvalidBase64 = "invalidBase64",
  InvalidJson = "invalidJson",
  InvalidShape = "invalidShape",
  UnsupportedSource = "unsupportedSource",
}

export type PreviewCaptionResult =
  | { status: "success"; caption: CaptionContainer }
  | { status: "error"; error: PreviewCaptionError };

const errorResult = (error: PreviewCaptionError): PreviewCaptionResult => ({
  status: "error",
  error,
});

/**
 * Decodes base64 (standard or URL-safe alphabet, padding optional) to a UTF-8 string.
 * Throws on invalid base64 or invalid UTF-8.
 */
const decodeBase64Utf8 = (input: string): string => {
  const normalized = input
    .replace(/\s/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
};

const isValidTrack = (track: unknown): track is Track => {
  if (typeof track !== "object" || track === null) {
    return false;
  }
  const cues = (track as Track).cues;
  if (!Array.isArray(cues)) {
    return false;
  }
  return cues.every(
    (cue) =>
      typeof cue === "object" &&
      cue !== null &&
      Number.isFinite(cue.start) &&
      cue.start >= 0 &&
      Number.isFinite(cue.end) &&
      typeof cue.text === "string",
  );
};

const validatePayload = (payload: unknown): PreviewCaptionResult => {
  if (typeof payload !== "object" || payload === null) {
    return errorResult(PreviewCaptionError.InvalidShape);
  }
  const { videoId, videoSource, data } = payload as {
    videoId: unknown;
    videoSource: unknown;
    data: unknown;
  };
  if (typeof videoId !== "string" || videoId.length <= 0) {
    return errorResult(PreviewCaptionError.InvalidShape);
  }
  if (typeof videoSource !== "number" || !Number.isInteger(videoSource)) {
    return errorResult(PreviewCaptionError.InvalidShape);
  }
  if (typeof data !== "object" || data === null) {
    return errorResult(PreviewCaptionError.InvalidShape);
  }
  const processor = videoSourceToProcessorMap[videoSource as VideoSource];
  if (!processor || !processor.canWatchInNekoCapSite) {
    return errorResult(PreviewCaptionError.UnsupportedSource);
  }
  const { tracks, settings } = data as CaptionDataContainer;
  if (!Array.isArray(tracks) || tracks.length <= 0) {
    return errorResult(PreviewCaptionError.InvalidShape);
  }
  const clampedTracks = tracks.slice(0, MAX_TRACKS);
  if (!clampedTracks.every(isValidTrack)) {
    return errorResult(PreviewCaptionError.InvalidShape);
  }
  const totalCues = clampedTracks.reduce(
    (total, track) => total + track.cues.length,
    0,
  );
  if (totalCues > MAX_PREVIEW_TOTAL_CUES) {
    return errorResult(PreviewCaptionError.TooLarge);
  }
  const caption: CaptionContainer = {
    videoId,
    videoSource: videoSource as VideoSource,
    data: { tracks: clampedTracks, settings },
    loadedByUser: true,
    userLike: null,
    userDislike: null,
  };
  return { status: "success", caption };
};

/**
 * Extracts the `data` param from a URL hash fragment.
 * URLSearchParams is deliberately avoided: it decodes "+" to a space, which
 * would silently corrupt standard base64 payloads.
 * Returns undefined when the hash carries no `data` param at all.
 */
export const extractPreviewData = (hash: string): string | undefined => {
  const match = hash.replace(/^#/, "").match(/(?:^|&)data=([^&]*)/);
  if (!match) {
    return undefined;
  }
  let raw = match[1];
  try {
    raw = decodeURIComponent(raw);
  } catch (e) {
    // Keep the raw value: base64 characters do not require percent-encoding
  }
  return raw;
};

/**
 * Parses a viewer preview hash fragment (`#data=<base64 caption JSON>`) into
 * a renderable CaptionContainer. The payload must be a base64 encoded JSON
 * object of the shape { videoId, videoSource, data: { tracks: [...] } }.
 * Returns undefined when the hash has no `data` param.
 */
export const parsePreviewHash = (
  hash: string,
): PreviewCaptionResult | undefined => {
  const encodedData = extractPreviewData(hash);
  if (encodedData === undefined) {
    return undefined;
  }
  if (encodedData.length > MAX_PREVIEW_BASE64_LENGTH) {
    return errorResult(PreviewCaptionError.TooLarge);
  }
  let jsonString: string;
  try {
    jsonString = decodeBase64Utf8(encodedData);
  } catch (e) {
    return errorResult(PreviewCaptionError.InvalidBase64);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(jsonString);
  } catch (e) {
    return errorResult(PreviewCaptionError.InvalidJson);
  }
  return validatePayload(payload);
};

/**
 * Display names of video sites whose videos can be watched on the NekoCap
 * website, for use in preview instructions and error messages.
 */
export const getPreviewSupportedSiteNames = (): string[] => {
  return Array.from(
    new Set(
      Object.values(videoSourceToProcessorMap)
        .filter((processor) => processor.canWatchInNekoCapSite)
        .map((processor) => processor.name),
    ),
  );
};
