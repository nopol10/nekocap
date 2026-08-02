import { VideoSource } from "@/common/feature/video/types";
import { deflateRawSync } from "zlib";
import { describe, expect, it } from "vitest";
import {
  buildEditorUrlFromPreviewHash,
  getPreviewSupportedSiteNames,
  MAX_PREVIEW_BASE64_LENGTH,
  MAX_PREVIEW_DECOMPRESSED_BYTES,
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

/** Matches what the bot produces: raw DEFLATE, then base64url. */
const encodeCompressed = (payload: unknown): string =>
  deflateRawSync(Buffer.from(JSON.stringify(payload), "utf-8"), {
    level: 9,
  }).toString("base64url");

describe("parsePreviewHash", () => {
  it("returns undefined when the hash has no data param", async () => {
    expect(await parsePreviewHash("")).toBeUndefined();
    expect(await parsePreviewHash("#")).toBeUndefined();
    expect(await parsePreviewHash("#other=value")).toBeUndefined();
  });

  it("decodes a standard base64 payload with unicode text", async () => {
    const result = await parsePreviewHash(`#data=${encode(samplePayload())}`);
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

  it("decodes URL-safe base64 without padding", async () => {
    const result = await parsePreviewHash(
      `#data=${encodeUrlSafe(samplePayload())}`,
    );
    expect(result?.status).toEqual("success");
  });

  it("preserves + characters instead of decoding them as spaces", async () => {
    // Craft a payload whose base64 encoding contains a "+"
    let payload = samplePayload();
    let encoded = encode(payload);
    for (let i = 0; !encoded.includes("+") && i < 200; i++) {
      payload = samplePayload({ videoId: `video-${i}` });
      encoded = encode(payload);
    }
    expect(encoded).toContain("+");
    expect((await parsePreviewHash(`#data=${encoded}`))?.status).toEqual(
      "success",
    );
  });

  it("accepts percent-encoded payloads", async () => {
    const encoded = encodeURIComponent(encode(samplePayload()));
    expect((await parsePreviewHash(`#data=${encoded}`))?.status).toEqual(
      "success",
    );
  });

  it("ignores whitespace inside the base64 payload", async () => {
    const encoded = encode(samplePayload());
    const withWhitespace = `${encoded.slice(0, 10)}\n${encoded.slice(10)}`;
    expect((await parsePreviewHash(`#data=${withWhitespace}`))?.status).toEqual(
      "success",
    );
  });

  it("reads the data param when other hash params are present", async () => {
    const encoded = encode(samplePayload());
    expect(
      (await parsePreviewHash(`#foo=bar&data=${encoded}`))?.status,
    ).toEqual("success");
  });

  it("rejects oversized payloads", async () => {
    const oversized = "A".repeat(MAX_PREVIEW_BASE64_LENGTH + 1);
    expect(await parsePreviewHash(`#data=${oversized}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.TooLarge,
    });
  });

  it("rejects malformed base64", async () => {
    expect(await parsePreviewHash("#data=!!!not-base64!!!")).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidBase64,
    });
  });

  it("rejects base64 that does not contain JSON", async () => {
    const encoded = Buffer.from("not json at all", "utf-8").toString("base64");
    expect(await parsePreviewHash(`#data=${encoded}`)).toEqual({
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
  ])("rejects invalid shape: %s", async (description, payload) => {
    expect(await parsePreviewHash(`#data=${encode(payload)}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidShape,
    });
  });

  it("rejects sources that cannot be watched on the NekoCap site", async () => {
    const result = await parsePreviewHash(
      `#data=${encode(samplePayload({ videoSource: VideoSource.Netflix }))}`,
    );
    expect(result).toEqual({
      status: "error",
      error: PreviewCaptionError.UnsupportedSource,
    });
  });

  it("clamps the number of tracks to the maximum", async () => {
    const track = {
      cues: [{ start: 0, end: 1000, text: "cue" }],
    };
    const payload = samplePayload({
      data: { tracks: Array.from({ length: 15 }, () => track) },
    });
    const result = await parsePreviewHash(`#data=${encode(payload)}`);
    if (result?.status !== "success") {
      throw new Error("expected success");
    }
    expect(result.caption.data.tracks).toHaveLength(10);
  });

  it("rejects payloads with too many cues in total", async () => {
    const cues = Array.from({ length: 20001 }, (unused, index) => ({
      start: index,
      end: index + 1,
      text: "c",
    }));
    const payload = samplePayload({ data: { tracks: [{ cues }] } });
    expect(await parsePreviewHash(`#data=${encode(payload)}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.TooLarge,
    });
  });
});

describe("parsePreviewHash with a compressed payload", () => {
  it("decodes a deflate-raw payload with unicode text", async () => {
    const result = await parsePreviewHash(
      `#dataz=${encodeCompressed(samplePayload())}`,
    );
    if (result?.status !== "success") {
      throw new Error("expected success");
    }
    expect(result.caption.videoId).toEqual("dQw4w9WgXcQ");
    expect(result.caption.data.tracks[0].cues[0].text).toEqual(
      "こんにちは、プレビュー",
    );
  });

  it("produces the same caption as the uncompressed form", async () => {
    const compressed = await parsePreviewHash(
      `#dataz=${encodeCompressed(samplePayload())}`,
    );
    const plain = await parsePreviewHash(`#data=${encode(samplePayload())}`);
    expect(compressed).toEqual(plain);
  });

  it("is dramatically shorter than the uncompressed form", async () => {
    const cues = Array.from({ length: 120 }, (unused, index) => ({
      start: index * 2500,
      end: index * 2500 + 2200,
      text: "So anyway, that is roughly how it works.",
    }));
    const payload = samplePayload({ data: { tracks: [{ cues }] } });
    expect(encodeCompressed(payload).length * 5).toBeLessThan(
      encodeUrlSafe(payload).length,
    );
  });

  it("reads dataz when other hash params are present", async () => {
    const encoded = encodeCompressed(samplePayload());
    expect(
      (await parsePreviewHash(`#foo=bar&dataz=${encoded}`))?.status,
    ).toEqual("success");
  });

  it("prefers dataz when both params are present", async () => {
    const compressed = encodeCompressed(
      samplePayload({ videoId: "aaaaaaaaaaa" }),
    );
    const plain = encode(samplePayload({ videoId: "bbbbbbbbbbb" }));
    const result = await parsePreviewHash(`#data=${plain}&dataz=${compressed}`);
    if (result?.status !== "success") {
      throw new Error("expected success");
    }
    expect(result.caption.videoId).toEqual("aaaaaaaaaaa");
  });

  it("rejects base64 that is not valid deflate data", async () => {
    const notDeflate = Buffer.from("definitely not deflate", "utf-8").toString(
      "base64url",
    );
    expect(await parsePreviewHash(`#dataz=${notDeflate}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidCompressedData,
    });
  });

  it("rejects a decompression bomb instead of inflating it", async () => {
    // A few hundred KB of zeros deflates to a tiny payload but inflates to far
    // more than the cap, which would otherwise hang the tab
    const bomb = deflateRawSync(
      Buffer.alloc(MAX_PREVIEW_DECOMPRESSED_BYTES * 4, 0),
      { level: 9 },
    ).toString("base64url");
    expect(bomb.length).toBeLessThan(MAX_PREVIEW_BASE64_LENGTH);
    expect(await parsePreviewHash(`#dataz=${bomb}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.InvalidCompressedData,
    });
  });

  it("still rejects an oversized encoded payload before inflating", async () => {
    const oversized = "A".repeat(MAX_PREVIEW_BASE64_LENGTH + 1);
    expect(await parsePreviewHash(`#dataz=${oversized}`)).toEqual({
      status: "error",
      error: PreviewCaptionError.TooLarge,
    });
  });
});

describe("buildEditorUrlFromPreviewHash", () => {
  const captionFrom = async (payload: unknown) => {
    const result = await parsePreviewHash(`#data=${encode(payload)}`);
    if (result?.status !== "success") {
      throw new Error("expected success");
    }
    return result.caption;
  };

  it("returns undefined when the hash has no data param", async () => {
    const caption = await captionFrom(samplePayload());
    expect(buildEditorUrlFromPreviewHash(caption, "")).toBeUndefined();
    expect(
      buildEditorUrlFromPreviewHash(caption, "#other=value"),
    ).toBeUndefined();
  });

  it("points the editor at the video and keeps the compressed payload", async () => {
    const payload = samplePayload();
    const caption = await captionFrom(payload);
    const url = buildEditorUrlFromPreviewHash(
      caption,
      `#dataz=${encodeCompressed(payload)}`,
    );
    expect(url).toBeDefined();
    expect(
      url?.startsWith("/create?videoId=dQw4w9WgXcQ&videoSource=0#dataz="),
    ).toBe(true);
  });

  it("keeps an uncompressed payload on its own param", async () => {
    const payload = samplePayload();
    const caption = await captionFrom(payload);
    const url = buildEditorUrlFromPreviewHash(
      caption,
      `#data=${encode(payload)}`,
    );
    expect(url).toContain("#data=");
    expect(url).not.toContain("#dataz=");
  });

  it("drops hash params other than the payload", async () => {
    const payload = samplePayload();
    const caption = await captionFrom(payload);
    const url = buildEditorUrlFromPreviewHash(
      caption,
      `#other=value&dataz=${encodeCompressed(payload)}`,
    );
    expect(url).not.toContain("other=value");
  });

  it("produces a hash the editor can decode back into the same caption", async () => {
    const payload = samplePayload();
    const caption = await captionFrom(payload);
    const url = buildEditorUrlFromPreviewHash(
      caption,
      // Standard base64 carries "+" and "/", which must survive the round trip
      `#data=${encode(payload)}`,
    );
    const hash = url?.substring(url.indexOf("#")) || "";
    const result = await parsePreviewHash(hash);
    expect(result).toEqual({ status: "success", caption });
  });
});

describe("getPreviewSupportedSiteNames", () => {
  it("lists the sites that can be watched on the NekoCap website", async () => {
    const names = getPreviewSupportedSiteNames();
    expect(names).toContain("YouTube");
    expect(names).toContain("Vimeo");
    expect(names).toContain("Dailymotion");
    // Names are deduplicated
    expect(new Set(names).size).toEqual(names.length);
  });
});
