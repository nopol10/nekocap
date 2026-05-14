import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LexicalEditorWrapper } from "./lexical-editor-wrapper";

/**
 * Behavioral tests for the rich-text caption editor.
 *
 * These tests target the public contract of LexicalEditorWrapper:
 *   - `initialText` is consumed as WebVTT-style HTML on mount.
 *   - `onChange` emits WebVTT-style HTML that round-trips back through the
 *     same input shape.
 *   - `onBackgroundColorDetected` reports the <nr> wrapper colour and the
 *     `backgroundColor` prop drives whether that wrapper appears in the
 *     emitted output.
 *
 * They deliberately do NOT inspect internal Lexical DOM structure, theme
 * class names, plugin organisation, or any exported helpers, so the
 * serializer/importer can be refactored (e.g. AST walk vs HTML re-parse)
 * without breaking the suite.
 */

vi.mock("@/common/processor-utils", () => ({
  darkModeSelector: () => "",
}));

type MountResult = {
  onChange: ReturnType<typeof vi.fn>;
  onBackgroundColorDetected: ReturnType<typeof vi.fn>;
  rerender: (props: Partial<MountProps>) => void;
  unmount: () => void;
};

type MountProps = {
  initialText: string;
  backgroundColor?: string;
};

function mount(props: MountProps): MountResult {
  const onChange = vi.fn();
  const onBackgroundColorDetected = vi.fn();
  const utils = render(
    <LexicalEditorWrapper
      initialText={props.initialText}
      backgroundColor={props.backgroundColor}
      onChange={onChange}
      onBackgroundColorDetected={onBackgroundColorDetected}
    />,
  );
  return {
    onChange,
    onBackgroundColorDetected,
    rerender: (next) =>
      utils.rerender(
        <LexicalEditorWrapper
          initialText={next.initialText ?? props.initialText}
          backgroundColor={
            next.backgroundColor !== undefined
              ? next.backgroundColor
              : props.backgroundColor
          }
          onChange={onChange}
          onBackgroundColorDetected={onBackgroundColorDetected}
        />,
      ),
    unmount: utils.unmount,
  };
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
    const { onChange } = mount({ initialText: "hello world" });
    const emitted = await getLatestEmittedText(onChange);
    expect(normalize(emitted)).toBe("hello world");
  });

  it("preserves <b> formatting through a round-trip", async () => {
    const { onChange } = mount({ initialText: "hello <b>world</b>" });
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toContain("hello");
    expect(emitted).toMatch(/<b>world<\/b>/);
  });

  it("preserves <i> formatting through a round-trip", async () => {
    const { onChange } = mount({ initialText: "<i>italic</i> text" });
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toMatch(/<i>italic<\/i>/);
    expect(emitted).toContain("text");
  });

  it("preserves <u> formatting through a round-trip", async () => {
    const { onChange } = mount({ initialText: "an <u>underline</u> word" });
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toMatch(/<u>underline<\/u>/);
  });

  it("preserves nested bold+italic", async () => {
    const { onChange } = mount({
      initialText: "<b><i>both</i></b>",
    });
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
    const { onChange } = mount({ initialText: "just text" });
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
      const first = mount({ initialText: input });
      const firstOutput = await getLatestEmittedText(first.onChange);
      first.unmount();

      const second = mount({ initialText: firstOutput });
      const secondOutput = await getLatestEmittedText(second.onChange);
      second.unmount();

      expect(normalize(secondOutput)).toBe(normalize(firstOutput));
    }
  });
});

describe("LexicalEditorWrapper - colour preservation", () => {
  it("preserves an <nc style='color: ...'> wrapper in the emitted output", async () => {
    const { onChange } = mount({
      initialText: '<nc style="color: #ff0000">red text</nc>',
    });
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toContain("red text");
    expect(emitted).toMatch(/<nc[^>]*style="color:\s*(#ff0000|rgb\([^)]+\))"/i);
  });

  it("preserves colour through a re-mount round-trip (regression: text colour going missing on cue time change)", async () => {
    const first = mount({
      initialText: '<nc style="color: #00ff00">green</nc>',
    });
    const firstOutput = await getLatestEmittedText(first.onChange);
    first.unmount();

    const second = mount({ initialText: firstOutput });
    const secondOutput = await getLatestEmittedText(second.onChange);
    second.unmount();

    expect(secondOutput).toContain("green");
    expect(secondOutput).toMatch(/color:\s*(#00ff00|rgb\(0,\s*255,\s*0\))/i);
  });

  it("preserves colour together with bold formatting", async () => {
    const { onChange } = mount({
      initialText: '<b><nc style="color: #0000ff">blue bold</nc></b>',
    });
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toContain("blue bold");
    expect(emitted).toMatch(/<b>/);
    expect(emitted).toMatch(/color:\s*(#0000ff|rgb\(0,\s*0,\s*255\))/i);
  });
});

describe("LexicalEditorWrapper - background colour (<nr>)", () => {
  it("reports background colour via onBackgroundColorDetected and strips <nr> when not provided as prop", async () => {
    const { onChange, onBackgroundColorDetected } = mount({
      initialText: '<nr background-color="#123456">inside</nr>',
    });

    await waitFor(() => {
      expect(onBackgroundColorDetected).toHaveBeenCalledWith("#123456");
    });

    const emitted = await getLatestEmittedText(onChange);
    // With no backgroundColor prop, no <nr> wrapper should be re-emitted.
    expect(emitted).not.toContain("<nr");
    expect(emitted).toContain("inside");
  });

  it("does not call onBackgroundColorDetected with a colour when input has no <nr> wrapper", async () => {
    const { onBackgroundColorDetected, onChange } = mount({
      initialText: "no background here",
    });
    await getLatestEmittedText(onChange);
    const colourArgs = onBackgroundColorDetected.mock.calls
      .map((c) => c[0])
      .filter((c) => c);
    expect(colourArgs).toHaveLength(0);
  });

  it("wraps output in <nr> when backgroundColor prop is set", async () => {
    const { onChange } = mount({
      initialText: "text",
      backgroundColor: "#abcdef",
    });
    const emitted = await getLatestEmittedText(onChange);
    expect(emitted).toMatch(/^<nr\s+background-color="#abcdef">/);
    expect(emitted).toMatch(/<\/nr>$/);
    expect(emitted).toContain("text");
  });

  it("updates the <nr> wrapper when backgroundColor prop changes", async () => {
    const result = mount({
      initialText: "text",
      backgroundColor: "#111111",
    });

    await waitFor(() => {
      const last =
        result.onChange.mock.calls[result.onChange.mock.calls.length - 1]?.[0];
      expect(last).toMatch(/background-color="#111111"/);
    });

    act(() => {
      result.rerender({ backgroundColor: "#222222" });
    });

    await waitFor(() => {
      const last =
        result.onChange.mock.calls[result.onChange.mock.calls.length - 1]?.[0];
      expect(last).toMatch(/background-color="#222222"/);
      expect(last).not.toMatch(/background-color="#111111"/);
    });
  });

  it("removes the <nr> wrapper when backgroundColor prop is cleared", async () => {
    const result = mount({
      initialText: "text",
      backgroundColor: "#abcabc",
    });

    await waitFor(() => {
      const last =
        result.onChange.mock.calls[result.onChange.mock.calls.length - 1]?.[0];
      expect(last).toMatch(/<nr\s+background-color/);
    });

    act(() => {
      result.rerender({ backgroundColor: "" });
    });

    await waitFor(() => {
      const last =
        result.onChange.mock.calls[result.onChange.mock.calls.length - 1]?.[0];
      expect(last).not.toContain("<nr");
      expect(last).toContain("text");
    });
  });
});
