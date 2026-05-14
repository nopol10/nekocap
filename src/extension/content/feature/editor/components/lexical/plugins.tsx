import * as React from "react";
import { useEffect, useState } from "react";
import {
  $getRoot,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  LexicalEditor,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import { ColoredTextNode } from "./colored-text-node";
import {
  extractNrTag,
  serializeEditorToHtml,
  webvttToLexicalHtml,
} from "./serialization";

export function FocusEmitterPlugin({
  onFocus,
}: {
  onFocus?: (editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(
    function registerFocusCommand() {
      if (!onFocus) return;
      return editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          onFocus(editor);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      );
    },
    [editor, onFocus],
  );

  return null;
}

// Plugin to parse initial HTML (WebVTT strings converted to HTML)
export function HtmlPlugin({
  initialHtml,
  onBackgroundColorDetected,
}: {
  initialHtml: string;
  onBackgroundColorDetected?: (color: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (!isFirstRender) return;
    setIsFirstRender(false);

    const { backgroundColor, innerHtml: htmlWithoutNr } = extractNrTag(
      initialHtml || "",
    );
    if (onBackgroundColorDetected) {
      onBackgroundColorDetected(backgroundColor);
    }

    editor.update(() => {
      const processedHtml = webvttToLexicalHtml(htmlWithoutNr);
      const parser = new DOMParser();
      const dom = parser.parseFromString(processedHtml, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, initialHtml, isFirstRender, onBackgroundColorDetected]);

  return null;
}

// Mark TextNodes with color styles as unmergeable so Lexical keeps them
// as separate nodes and doesn't merge the color into format tags (strong/em).
export function UnmergeableColorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(ColoredTextNode, (node) => {
      const hasColor = node.getStyle().includes("color:");
      if (hasColor && !node.isUnmergeable()) {
        node.toggleUnmergeable();
      } else if (!hasColor && node.isUnmergeable()) {
        node.toggleUnmergeable();
      }
    });
  }, [editor]);

  return null;
}

// Convert Lexical's internal AST back to WebVTT-like text output
export function OnChangeHtmlPlugin({
  onChange,
  backgroundColor,
}: {
  onChange: (html: string) => void;
  backgroundColor?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const backgroundColorRef = React.useRef(backgroundColor);
  backgroundColorRef.current = backgroundColor;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }
        editorState.read(() => {
          onChangeRef.current(
            serializeEditorToHtml(editor, backgroundColorRef.current),
          );
        });
      },
    );
  }, [editor]);

  const prevBackgroundColor = React.useRef(backgroundColor);

  // Re-emit when backgroundColor changes so the <nr> wrapper is updated immediately
  useEffect(() => {
    if (prevBackgroundColor.current === backgroundColor) return;
    prevBackgroundColor.current = backgroundColor;

    editor.getEditorState().read(() => {
      onChangeRef.current(serializeEditorToHtml(editor, backgroundColor));
    });
  }, [editor, backgroundColor]);

  return null;
}
