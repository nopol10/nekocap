import type {
  CaptionDataContainer,
  Track,
} from "@/common/caption-parsers/types";
import { MAX_TRACKS } from "@/common/feature/video/constants";
import { CaptionContainer, VideoSource } from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { routeNames } from "@/web/feature/route-types";

/**
 * Caps to keep decoding and validation of untrusted preview payloads fast.
 * ~2 million base64 characters is roughly 1.5 MB of decoded JSON.
 */
export const MAX_PREVIEW_BASE64_LENGTH = 2_000_000;
export const MAX_PREVIEW_TOTAL_CUES = 20_000;

/**
 * Cap on the inflated size of a compressed payload. Without it a small link
 * could inflate to gigabytes and hang the tab, since compressed data can
 * expand by several orders of magnitude. Matches the decoded size the base64
 * cap above assumes.
 */
export const MAX_PREVIEW_DECOMPRESSED_BYTES = 1_500_000;

export enum PreviewCaptionError {
  TooLarge = "tooLarge",
  InvalidBase64 = "invalidBase64",
  InvalidCompressedData = "invalidCompressedData",
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
const decodeBase64 = (input: string): Uint8Array => {
  const normalized = input
    .replace(/\s/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = globalThis.atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const decodeBase64Utf8 = (input: string): string => {
  return new TextDecoder("utf-8", { fatal: true }).decode(decodeBase64(input));
};

/**
 * Inflates raw DEFLATE bytes to a UTF-8 string, refusing to keep going past
 * MAX_PREVIEW_DECOMPRESSED_BYTES so an untrusted link cannot expand without
 * bound. Throws on malformed input, invalid UTF-8, or an oversized result.
 */
const inflateRawUtf8 = async (bytes: Uint8Array): Promise<string> => {
  // Fed straight into the stream rather than via a Blob: Blob.stream() is
  // missing under jsdom, and this avoids a copy of the whole payload anyway.
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const stream = source.pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      total += value.byteLength;
      if (total > MAX_PREVIEW_DECOMPRESSED_BYTES) {
        throw new Error("Decompressed payload is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return new TextDecoder("utf-8", { fatal: true }).decode(merged);
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

export type PreviewPayloadEncoding = "base64" | "deflate";

/** The hash param carrying each encoding. */
const ENCODING_PARAMS: { param: string; encoding: PreviewPayloadEncoding }[] = [
  { param: "dataz", encoding: "deflate" },
  { param: "data", encoding: "base64" },
];

/**
 * Extracts the payload from a URL hash fragment, along with how it is encoded:
 * `data=` is base64 encoded JSON, `dataz=` is the same JSON compressed with
 * raw DEFLATE first. `dataz` wins if somehow both are present.
 *
 * URLSearchParams is deliberately avoided: it decodes "+" to a space, which
 * would silently corrupt standard base64 payloads.
 * Returns undefined when the hash carries neither param.
 */
export const extractPreviewData = (
  hash: string,
): { data: string; encoding: PreviewPayloadEncoding } | undefined => {
  const fragment = hash.replace(/^#/, "");
  for (const { param, encoding } of ENCODING_PARAMS) {
    const match = fragment.match(new RegExp(`(?:^|&)${param}=([^&]*)`));
    if (!match) {
      continue;
    }
    let raw = match[1];
    try {
      raw = decodeURIComponent(raw);
    } catch (e) {
      // Keep the raw value: base64 characters do not require percent-encoding
    }
    return { data: raw, encoding };
  }
  return undefined;
};

/**
 * Parses a viewer preview hash fragment into a renderable CaptionContainer.
 * The payload is a JSON object of the shape
 * { videoId, videoSource, data: { tracks: [...] } }, either base64 encoded
 * (`#data=`) or raw DEFLATE compressed and then base64 encoded (`#dataz=`).
 *
 * Compression typically shrinks the payload by 5-15x, which is what keeps
 * links for longer videos shareable. Inflating is asynchronous because
 * browsers offer no synchronous inflate.
 *
 * Returns undefined when the hash has neither param.
 */
export const parsePreviewHash = async (
  hash: string,
): Promise<PreviewCaptionResult | undefined> => {
  const extracted = extractPreviewData(hash);
  if (extracted === undefined) {
    return undefined;
  }
  const { data: encodedData, encoding } = extracted;
  if (encodedData.length > MAX_PREVIEW_BASE64_LENGTH) {
    return errorResult(PreviewCaptionError.TooLarge);
  }
  let jsonString: string;
  if (encoding === "deflate") {
    let bytes: Uint8Array;
    try {
      bytes = decodeBase64(encodedData);
    } catch (e) {
      return errorResult(PreviewCaptionError.InvalidBase64);
    }
    try {
      jsonString = await inflateRawUtf8(bytes);
    } catch (e) {
      return errorResult(PreviewCaptionError.InvalidCompressedData);
    }
  } else {
    try {
      jsonString = decodeBase64Utf8(encodedData);
    } catch (e) {
      return errorResult(PreviewCaptionError.InvalidBase64);
    }
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
 * Builds the web editor link that opens a previewed caption for editing.
 *
 * The caption payload is handed over by carrying the preview hash across
 * unchanged, so the editor can decode it with parsePreviewHash just like the
 * preview page does. That keeps the link self contained: it survives a reload
 * and can be shared as an "edit this caption" link. videoId and videoSource are
 * repeated in the query string because the editor page reads them from there.
 *
 * Only the recognised payload param is carried over, so anything else in the
 * hash is left behind. Returns undefined when the hash has no payload.
 */
export const buildEditorUrlFromPreviewHash = (
  caption: CaptionContainer,
  hash: string,
): string | undefined => {
  const extracted = extractPreviewData(hash);
  if (extracted === undefined) {
    return undefined;
  }
  const param = ENCODING_PARAMS.find(
    ({ encoding }) => encoding === extracted.encoding,
  )?.param;
  if (!param) {
    return undefined;
  }
  const query = `videoId=${encodeURIComponent(caption.videoId)}&videoSource=${
    caption.videoSource
  }`;
  return `${routeNames.caption.create}?${query}#${param}=${encodeURIComponent(
    extracted.data,
  )}`;
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
