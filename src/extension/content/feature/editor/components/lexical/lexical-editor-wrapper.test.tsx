import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LexicalEditorWrapper } from "./lexical-editor-wrapper";

/**
 * Behavioral tests for the rich-text caption editor.
 *
 * These tests target the public contract of LexicalEditorWrapper:
 *   - `initialText` is consumed as HTML on mount.
 *   - `onChange` emits HTML that round-trips back through the same input
 *     shape (bold/italic/underline/font-colour).
 *
 * They deliberately do NOT inspect internal Lexical DOM structure, theme
 * class names, plugin organisation, or any exported helpers, so the
 * serializer/importer can be refactored without breaking the suite.
 */

vi.mock("@/common/processor-utils", () => ({
  darkModeSelector: () => "",
}));

type MountResult = {
  onChange: ReturnType<typeof vi.fn>;
  unmount: () => void;
};

function mount(initialText: string): MountResult {
  const onChange = vi.fn();
  const utils = render(
    <LexicalEditorWrapper initialText={initialText} onChange={onChange} />,
  );
  return { onChange, unmount: utils.unmount };
}

async function getLatestEmittedText(
  onChange: ReturnType<typeof vi.fn>,
): Promise<string> {
  await waitFor(() => {
    expect(onChange).toHaveBeenCalled();
  });
  const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
  return lastCall[0] as string;
}

function normalize(text: string): string {
  return text.replace(/\s+$/g, "").replace(/\n+$/g, "");
}

describe("LexicalEditorWrapper - initial parse and onChange round-trip", () => {
  it("emits plain text unchanged", async () => {
    const { onChange } = mount("hello world");
    const emitted = await getLatestEmittedText(onChange);
    expect(normalize(emitted)).toBe("hello world");
  });

  it("preserves <b> formatting through a round-trip", async () => {
    const { onChange } = mount("hello <b>world</b>");
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toContain("hello");
    expect(emitted).toMatch(/<b>world<\/b>/);
  });

  it("preserves <i> formatting through a round-trip", async () => {
    const { onChange } = mount("<i>italic</i> text");
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toMatch(/<i>italic<\/i>/);
    expect(emitted).toContain("text");
  });

  it("preserves <u> formatting through a round-trip", async () => {
    const { onChange } = mount("an <u>underline</u> word");
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toMatch(/<u>underline<\/u>/);
  });

  it("preserves nested bold+italic", async () => {
    const { onChange } = mount("<b><i>both</i></b>");
    const emitted = await getLatestEmittedText(onChange);
    // Either ordering of the wrappers is acceptable; both must be present
    // and there must be no double-wrap (e.g. <b><b>both</b></b>).
    expect(emitted).toContain("both");
    expect(emitted).toMatch(/<b>/);
    expect(emitted).toMatch(/<i>/);
    expect(emitted).not.toMatch(/<b>\s*<b>/);
    expect(emitted).not.toMatch(/<i>\s*<i>/);
  });

  it("does not introduce stray formatting when input has none", async () => {
    const { onChange } = mount("just text");
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).not.toMatch(/<b>|<i>|<u>|<strong>|<em>/);
  });

  it("is idempotent: feeding the emitted output back yields the same output", async () => {
    const inputs = [
      "plain text",
      "hello <b>world</b>",
      "<i>italic</i> and <b>bold</b>",
      "an <u>underline</u> word",
      "<b><i>both</i></b>",
    ];

    for (const input of inputs) {
      const first = mount(input);
      const firstOutput = await getLatestEmittedText(first.onChange);
      first.unmount();

      const second = mount(firstOutput);
      const secondOutput = await getLatestEmittedText(second.onChange);
      second.unmount();

      expect(normalize(secondOutput)).toBe(normalize(firstOutput));
    }
  });
});

describe("LexicalEditorWrapper - colour preservation", () => {
  it("preserves a <span style='color: ...'> wrapper in the emitted output", async () => {
    const { onChange } = mount('<span style="color: #ff0000">red text</span>');
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toContain("red text");
    expect(emitted).toMatch(
      /<span[^>]*style="color:\s*(#ff0000|rgb\([^)]+\))"/i,
    );
  });

  it("preserves colour through a re-mount round-trip (regression: text colour going missing on cue time change)", async () => {
    const first = mount('<span style="color: #00ff00">green</span>');
    const firstOutput = await getLatestEmittedText(first.onChange);
    first.unmount();

    const second = mount(firstOutput);
    const secondOutput = await getLatestEmittedText(second.onChange);
    second.unmount();

    expect(secondOutput).toContain("green");
    expect(secondOutput).toMatch(/color:\s*(#00ff00|rgb\(0,\s*255,\s*0\))/i);
  });

  it("preserves colour together with bold formatting", async () => {
    const { onChange } = mount(
      '<b><span style="color: #0000ff">blue bold</span></b>',
    );
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toContain("blue bold");
    expect(emitted).toMatch(/<b>/);
    expect(emitted).toMatch(/color:\s*(#0000ff|rgb\(0,\s*0,\s*255\))/i);
  });
});
