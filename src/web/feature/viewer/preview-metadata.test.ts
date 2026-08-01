import { VideoSource } from "@/common/feature/video/types";
import { describe, expect, it } from "vitest";
import { parsePreviewVideoParams } from "./preview-metadata";

describe("parsePreviewVideoParams", () => {
  it("defaults to YouTube when only a video id is given", () => {
    expect(parsePreviewVideoParams({ v: "dQw4w9WgXcQ" })).toEqual({
      videoId: "dQw4w9WgXcQ",
      videoSource: VideoSource.Youtube,
    });
  });

  it("reads an explicit video source", () => {
    expect(parsePreviewVideoParams({ v: "123456789", s: "2" })).toEqual({
      videoId: "123456789",
      videoSource: VideoSource.Vimeo,
    });
  });

  it("takes the first value when a param is repeated", () => {
    expect(
      parsePreviewVideoParams({ v: ["dQw4w9WgXcQ", "other"] }),
    ).toMatchObject({ videoId: "dQw4w9WgXcQ" });
  });

  it("returns undefined when there is no video id", () => {
    expect(parsePreviewVideoParams({})).toBeUndefined();
    expect(parsePreviewVideoParams({ v: "" })).toBeUndefined();
  });

  it("rejects video ids that are not plausible ids", () => {
    // These reach the page from an arbitrary link, so anything that would end
    // up interpolated into a URL or a meta tag has to be refused
    [
      "has spaces",
      "../../etc/passwd",
      "javascript:alert(1)",
      '"><script>alert(1)</script>',
      "https://evil.example.com/x",
      "a".repeat(65),
    ].forEach((videoId) => {
      expect(parsePreviewVideoParams({ v: videoId })).toBeUndefined();
    });
  });

  it("rejects a non-numeric video source", () => {
    expect(
      parsePreviewVideoParams({ v: "dQw4w9WgXcQ", s: "youtube" }),
    ).toBeUndefined();
  });

  it("rejects sources that cannot be watched on the NekoCap site", () => {
    expect(
      parsePreviewVideoParams({
        v: "dQw4w9WgXcQ",
        s: String(VideoSource.Netflix),
      }),
    ).toBeUndefined();
    expect(
      parsePreviewVideoParams({ v: "dQw4w9WgXcQ", s: "9999999" }),
    ).toBeUndefined();
  });
});
