import { CaptionContainer, VideoSource } from "@/common/feature/video/types";
import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaptionRenderer } from "./caption-renderer";

// Mock useAnimationFrame and useResize to avoid act warnings and endless loops
vi.mock("@/hooks", () => ({
  useAnimationFrame: (fps, callback) => {
    // Manually trigger it once immediately
    React.useEffect(() => {
      callback(0, true);
    }, [callback]);
  },
  useResize: () => {
    /* noop */
  },
}));

// Mock refreshVideoMeta
vi.mock("../utils", () => ({
  refreshVideoMeta: vi.fn(),
}));

// Mock isInExtension
vi.mock("@/common/client-utils", () => ({
  isInExtension: () => false,
}));

describe("CaptionRenderer webvtt formatting", () => {
  let captionContainerElement: HTMLElement;

  beforeEach(() => {
    captionContainerElement = document.createElement("div");
    document.body.appendChild(captionContainerElement);
  });

  it("renders standard html tags like b, i, u correctly", () => {
    const caption: CaptionContainer = {
      languageCode: "en",
      data: {
        tracks: [
          {
            cues: [
              {
                start: 0,
                end: 10000,
                text: "hello <b>world</b> <i>italic</i> <u>underline</u>",
              },
            ],
          },
        ],
      },
      videoId: "",
      videoSource: VideoSource.Youtube,
      loadedByUser: false,
      userLike: null,
      userDislike: null,
    };

    render(
      <CaptionRenderer
        caption={caption}
        captionContainerElement={captionContainerElement}
        showCaption={true}
        isIframe={true}
        iframeProps={{
          getCurrentTime: () => 5, // 5 seconds in
          width: 800,
          height: 600,
          left: 0,
          top: 0,
        }}
      />,
    );

    const textElements = captionContainerElement.querySelectorAll(
      ".nekocap-caption-text",
    );
    // We expect the first element with text to have the rendered HTML
    const activeTextElement = Array.from(textElements).find(
      (el) => el.innerHTML !== "",
    );

    expect(activeTextElement).toBeTruthy();
    expect(activeTextElement?.innerHTML).toContain("<b>world</b>");
    expect(activeTextElement?.innerHTML).toContain("<i>italic</i>");
    expect(activeTextElement?.innerHTML).toContain("<u>underline</u>");
  });

  it("sanitizes malicious input", () => {
    const caption: CaptionContainer = {
      languageCode: "en",
      data: {
        tracks: [
          {
            cues: [
              { start: 0, end: 10000, text: "hello <script>alert(1)</script>" },
            ],
          },
        ],
      },
      videoId: "",
      videoSource: VideoSource.Youtube,
      loadedByUser: false,
      userLike: null,
      userDislike: null,
    };

    render(
      <CaptionRenderer
        caption={caption}
        captionContainerElement={captionContainerElement}
        showCaption={true}
        isIframe={true}
        iframeProps={{
          getCurrentTime: () => 5,
          width: 800,
          height: 600,
          left: 0,
          top: 0,
        }}
      />,
    );

    const textElements = captionContainerElement.querySelectorAll(
      ".nekocap-caption-text",
    );
    const activeTextElement = Array.from(textElements).find(
      (el) => el.innerHTML !== "",
    );

    expect(activeTextElement).toBeTruthy();
    // The script tag should be stripped by DOMPurify
    expect(activeTextElement?.innerHTML).not.toContain("<script>");
    expect(activeTextElement?.innerHTML).not.toContain("alert(1)");
  });
});
