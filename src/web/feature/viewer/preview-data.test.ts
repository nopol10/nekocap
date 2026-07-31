import { VideoSource } from "@/common/feature/video/types";
import { describe, expect, it } from "vitest";
import {
  getPreviewSupportedSiteNames,
  MAX_PREVIEW_BASE64_LENGTH,
  parsePreviewHash,
  PreviewCaptionError,
} from "./preview-data";

const samplePayload = (overrides: Record<string, unknown> = {}) => ({
  videoId: "dQw4w9WgXcQ",
  videoSource: VideoSource.Youtube,
  data: {
    tracks: [
      {
        cues: [
          { start: 1000, end: 4000, text: "こんにちは、プレビュー" },
          { start: 5000, end: 9000, text: "Second cue" },
        ],
      },
    ],
  },
  ...overrides,
});

const encode = (payload: unknown): string =>
  Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");

const encodeUrlSafe = (payload: unknown): string =>
  Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");

describe("parsePreviewHash", () => {
  it("returns undefined when the hash has no data param", () => {
    expect(parsePreviewHash("")).toBeUndefined();
    expect(parsePreviewHash("#")).toBeUndefined();
    expect(parsePreviewHash("#other=value")).toBeUndefined();
  });

  it("decodes a standard base64 payload with unicode text", () => {
    const result = parsePreviewHash(`#data=${encode(samplePayload())}`);
    expect(result).toMatchObject({
      status: "success",
      caption: {
        videoId: "dQw4w9WgXcQ",
        videoSource: VideoSource.Youtube,
        loadedByUser: true,
      },
    });
    if (result?.status !== "success") {
      throw new Error("expected success");
    }
    expect(result.caption.data.tracks[0].cues[0].text).toEqual(
      "こんにちは、プレビュー",
    );
  });

  it("decodes URL-safe base64 without padding", () => {
    const result = parsePreviewHash(`#data=${encodeUrlSafe(samplePayload())}`);
    expect(result?.status).toEqual("success");
  });

  it("preserves + characters instead of decoding them as spaces", () => {
    // Craft a payload whose base64 encoding contains a "+"
    let payload = samplePayload();
    let encoded = encode(payload);
    for (let i = 0; !encoded.includes("+") && i < 200; i++) {
      payload = samplePayload({ videoId: `video-${i}` });
      encoded = encode(payload);
    }
    expect(encoded).toContain("+");
    expect(parsePreviewHash(`#data=${encoded}`)?.status).toEqual("success");
  });

  it("accepts percent-encoded payloads", () => {
    const encoded = encodeURIComponent(encode(samplePayload()));
    expect(parsePreviewHash(`#data=${encoded}`)?.status).toEqual("success");
  });

  it("ignores whitespace inside the base64 payload", () => {
    const encoded = encode(samplePayload());
    const withWhitespace = `${encoded.slice(0, 10)}\n${encoded.slice(10)}`;
    expect(parsePreviewHash(`#data=${withWhitespace}`)?.status).toEqual(
      "success",
    );
  });

  it("reads the data param when other hash params are present", () => {
    const encoded = encode(samplePayload());
    expect(parsePreviewHash(`#foo=bar&data=${encoded}`)?.status).toEqual(
      "success",
    );
  });

  it("rejects oversized payloads", () => {
    const oversized = "A".repeat(MAX_PREVIEW_BASE64_LENGTH + 1);
    expect(parsePreviewHash(`#data=${oversized}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.TooLarge,
    });
  });

  it("rejects malformed base64", () => {
    expect(parsePreviewHash("#data=!!!not-base64!!!")).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidBase64,
    });
  });

  it("rejects base64 that does not contain JSON", () => {
    const encoded = Buffer.from("not json at all", "utf-8").toString("base64");
    expect(parsePreviewHash(`#data=${encoded}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidJson,
    });
  });

  it.each([
    ["missing videoId", samplePayload({ videoId: undefined })],
    ["empty videoId", samplePayload({ videoId: "" })],
    ["non-numeric videoSource", samplePayload({ videoSource: "0" })],
    ["missing data", samplePayload({ data: undefined })],
    ["missing tracks", samplePayload({ data: {} })],
    ["empty tracks", samplePayload({ data: { tracks: [] } })],
    [
      "track without cues",
      samplePayload({ data: { tracks: [{ settings: {} }] } }),
    ],
    [
      "cue with non-numeric start",
      samplePayload({
        data: { tracks: [{ cues: [{ start: "1", end: 2, text: "a" }] }] },
      }),
    ],
    [
      "cue with negative start",
      samplePayload({
        data: { tracks: [{ cues: [{ start: -1, end: 2, text: "a" }] }] },
      }),
    ],
    [
      "cue with non-string text",
      samplePayload({
        data: { tracks: [{ cues: [{ start: 1, end: 2, text: 3 }] }] },
      }),
    ],
  ])("rejects invalid shape: %s", (description, payload) => {
    expect(parsePreviewHash(`#data=${encode(payload)}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidShape,
    });
  });

  it("rejects sources that cannot be watched on the NekoCap site", () => {
    const result = parsePreviewHash(
      `#data=${encode(samplePayload({ videoSource: VideoSource.Netflix }))}`,
    );
    expect(result).toEqual({
      status: "error",
      error: PreviewCaptionError.UnsupportedSource,
    });
  });

  it("clamps the number of tracks to the maximum", () => {
    const track = {
      cues: [{ start: 0, end: 1000, text: "cue" }],
    };
    const payload = samplePayload({
      data: { tracks: Array.from({ length: 15 }, () => track) },
    });
    const result = parsePreviewHash(`#data=${encode(payload)}`);
    if (result?.status !== "success") {
      throw new Error("expected success");
    }
    expect(result.caption.data.tracks).toHaveLength(10);
  });

  it("rejects payloads with too many cues in total", () => {
    const cues = Array.from({ length: 20001 }, (unused, index) => ({
      start: index,
      end: index + 1,
      text: "c",
    }));
    const payload = samplePayload({ data: { tracks: [{ cues }] } });
    expect(parsePreviewHash(`#data=${encode(payload)}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.TooLarge,
    });
  });
});

describe("getPreviewSupportedSiteNames", () => {
  it("lists the sites that can be watched on the NekoCap website", () => {
    const names = getPreviewSupportedSiteNames();
    expect(names).toContain("YouTube");
    expect(names).toContain("Vimeo");
    expect(names).toContain("Dailymotion");
    // Names are deduplicated
    expect(new Set(names).size).toEqual(names.length);
  });
});
