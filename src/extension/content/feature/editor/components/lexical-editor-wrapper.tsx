import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $applyNodeReplacement,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  DOMConversionMap,
  DOMConversionOutput,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  SerializedTextNode,
  TextNode,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { Button, ColorPicker } from "antd";
import type { ColorPickerProps } from "antd";
import BoldOutlined from "@ant-design/icons/BoldOutlined";
import ItalicOutlined from "@ant-design/icons/ItalicOutlined";
import UnderlineOutlined from "@ant-design/icons/UnderlineOutlined";
import FontColorsOutlined from "@ant-design/icons/FontColorsOutlined";
import BgColorsOutlined from "@ant-design/icons/BgColorsOutlined";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { EditorTextAreaWrapper } from "./caption-editor.styled";
import { darkModeSelector } from "@/common/processor-utils";

const StaticToolbarWrapper = styled.div<{ $width: number; $height: number }>`
  display: flex;
  gap: 5px;
  --padding-y: 8px;
  --padding-x: 16px;
  padding: var(--padding-y) var(--padding-x);
  border-top: 1px solid ${({ theme }) => theme.colorBorder};
  width: calc(${({ $width }) => $width}px - (var(--padding-x) * 2));
  height: calc(${({ $height }) => $height}px - (var(--padding-y) * 2));
`;

const ContentEditableWrapper = styled.div<{ $borderColor?: string }>`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: auto;
  border: ${({ $borderColor }) =>
    $borderColor ? `2px solid ${$borderColor}` : "1px solid #d9d9d9"};
  font-family: "consolas", monospace;
  background-color: transparent;
  color: inherit;

  .lexical-editor {
    background-color: white;
    min-height: 100%;
    padding: 2px 4px;
    outline: none;
    cursor: text;

    ${darkModeSelector(`
      background-color: #1f1f1f;
      color: #e0e0e0;
    `)}

    p {
      margin-block: 0;
    }
  }

  .lexical-bold {
    font-weight: bold;
  }

  .lexical-italic {
    font-style: italic;
  }

  .lexical-underline {
    text-decoration: underline;
  }
`;

function FocusEmitterPlugin({
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

/**
 * Extract background-color from an <nr> wrapper tag using DOMParser.
 * Returns the color value and the inner HTML with the <nr> tag stripped.
 */
export function extractNrTag(html: string): {
  backgroundColor: string;
  innerHtml: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nrElement = doc.body.querySelector("nr");
  if (nrElement) {
    const bgColor = nrElement.getAttribute("background-color") || "";
    // Replace the outer HTML with inner content
    const innerHtml = nrElement.innerHTML;
    // Reconstruct: everything outside <nr> plus the inner content
    nrElement.replaceWith(...Array.from(nrElement.childNodes));
    return { backgroundColor: bgColor, innerHtml: doc.body.innerHTML };
  }
  return { backgroundColor: "", innerHtml: html };
}

/**
 * TextNode subclass that preserves the `color` style attribute when importing
 * <span style="color: ..."> elements via Lexical's HTML pipeline. Lexical's
 * default convertSpanElement only carries over bold/italic/underline/etc.
 * format flags and discards the `color` value, so without this override the
 * previously-applied font color would get stripped every time the editor
 * remounts (e.g. when a neighbouring cue's end time changes, flipping this
 * cue's row key) and then written back to Redux by OnChangeHtmlPlugin.
 */
class ColoredTextNode extends TextNode {
  static getType(): string {
    return "colored-text";
  }

  static clone(node: ColoredTextNode): ColoredTextNode {
    return new ColoredTextNode(node.__text, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    const importers = TextNode.importDOM();
    return {
      ...importers,
      span: () => ({
        conversion: $convertSpanElementPreservingColor,
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedTextNode): ColoredTextNode {
    return $applyNodeReplacement(
      new ColoredTextNode(serializedNode.text),
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: "colored-text",
    };
  }
}

function $convertSpanElementPreservingColor(
  domNode: HTMLSpanElement,
): DOMConversionOutput {
  const styleAttr = domNode.getAttribute("style") || "";
  const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
  const color = colorMatch ? colorMatch[1].trim().replace(/;$/, "") : null;

  const cssStyle = domNode.style;
  const fontWeight = cssStyle.fontWeight;
  const textDecoration = (cssStyle.textDecoration || "").split(" ");
  const hasBoldFontWeight = fontWeight === "700" || fontWeight === "bold";
  const hasItalicFontStyle = cssStyle.fontStyle === "italic";
  const hasUnderlineTextDecoration = textDecoration.includes("underline");
  const hasLinethroughTextDecoration = textDecoration.includes("line-through");
  const verticalAlign = cssStyle.verticalAlign;

  return {
    node: null,
    forChild: (lexicalNode) => {
      if (!$isTextNode(lexicalNode)) {
        return lexicalNode;
      }
      if (hasBoldFontWeight && !lexicalNode.hasFormat("bold")) {
        lexicalNode.toggleFormat("bold");
      }
      if (hasItalicFontStyle && !lexicalNode.hasFormat("italic")) {
        lexicalNode.toggleFormat("italic");
      }
      if (hasUnderlineTextDecoration && !lexicalNode.hasFormat("underline")) {
        lexicalNode.toggleFormat("underline");
      }
      if (
        hasLinethroughTextDecoration &&
        !lexicalNode.hasFormat("strikethrough")
      ) {
        lexicalNode.toggleFormat("strikethrough");
      }
      if (verticalAlign === "sub" && !lexicalNode.hasFormat("subscript")) {
        lexicalNode.toggleFormat("subscript");
      }
      if (verticalAlign === "super" && !lexicalNode.hasFormat("superscript")) {
        lexicalNode.toggleFormat("superscript");
      }
      if (color) {
        lexicalNode.setStyle(`color: ${color}`);
      }
      return lexicalNode;
    },
  };
}

// Plugin to parse initial HTML (WebVTT strings converted to HTML)
function HtmlPlugin({
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

    // Extract <nr> background-color before processing for Lexical
    const { backgroundColor, innerHtml: htmlWithoutNr } = extractNrTag(
      initialHtml || "",
    );
    if (onBackgroundColorDetected) {
      onBackgroundColorDetected(backgroundColor);
    }

    editor.update(() => {
      // Pre-process webvtt tags
      let processedHtml = htmlWithoutNr;
      processedHtml = processedHtml
        .replace(/<c\.([^>]+)>/g, '<span class="$1">')
        .replace(/<\/c>/g, "</span>")
        .replace(/<v ([^>]+)>/g, '<span title="$1">')
        .replace(/<\/v>/g, "</span>");

      // Convert <nc style="color: #hex"> to <span style="color: #hex"> for Lexical
      processedHtml = processedHtml
        .replace(/<nc\s+style="([^"]*)"/g, '<span style="$1"')
        .replace(/<\/nc>/g, "</span>");

      processedHtml = `<p>${processedHtml.replace(/\n/g, "<br>")}</p>`;

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
function UnmergeableColorPlugin() {
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

/**
 * Recursively serialize a DOM tree (produced by `$generateHtmlFromNodes`) into
 * the WebVTT-like format we persist to Redux.
 *
 * Lexical exports a TextNode with bold/italic format AND a `color` style as
 * `<i><b><strong style="color: ...">...</strong></b></i>`: the format flags
 * become outer <b>/<i> wrappers AND become the inner tag (<strong>/<em>) via
 * `getElementInnerTag`, and the `style` ends up on the inner tag. To keep
 * `color` round-trippable we have to emit it as a separate `<nc style="...">`
 * wrapper rather than leave the style on the format tag — on reload, Lexical's
 * default <strong>/<em>/<b>/<i> importers only carry bold/italic/etc. flags
 * from style, dropping the colour entirely.
 *
 * <b>/<i> are treated as passthrough when their only child is the
 * corresponding inner format tag (Lexical's own redundant wrap), so we don't
 * emit `<b><b>text</b></b>` for a single bold node.
 */
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  let childContent = Array.from(el.childNodes).map(serializeNode).join("");

  if (tag === "br") return "\n";
  if (tag === "p") return childContent + "\n";

  const styleAttr = el.getAttribute("style") || "";
  const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
  if (colorMatch) {
    const color = colorMatch[1].trim().replace(/;$/, "");
    childContent = `<nc style="color: ${color}">${childContent}</nc>`;
  }

  switch (tag) {
    case "strong":
      return `<b>${childContent}</b>`;
    case "em":
      return `<i>${childContent}</i>`;
    case "u":
      return `<u>${childContent}</u>`;
    case "b":
      // Lexical wraps its <strong> inner tag with an outer <b>; treat as
      // passthrough when the child already emits a <b>, so we don't double-wrap.
      if (
        el.children.length === 1 &&
        el.children[0].tagName.toLowerCase() === "strong"
      ) {
        return childContent;
      }
      return `<b>${childContent}</b>`;
    case "i":
      if (
        el.children.length === 1 &&
        el.children[0].tagName.toLowerCase() === "em"
      ) {
        return childContent;
      }
      return `<i>${childContent}</i>`;
    case "span":
      // Plain <span> passes through; any colour has already been emitted as
      // <nc> above. Spans without colour add no semantic info.
      return childContent;
    default:
      if (el.children.length === 0 && !childContent) {
        return "";
      }
      return childContent;
  }
}

function serializeEditorToHtml(
  editor: LexicalEditor,
  backgroundColor: string | undefined,
): string {
  const rawHtml = $generateHtmlFromNodes(editor, null);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  let html = Array.from(doc.body.childNodes).map(serializeNode).join("").trim();
  if (backgroundColor) {
    html = `<nr background-color="${backgroundColor}">${html}</nr>`;
  }
  return html;
}

// Convert Lexical's internal AST back to WebVTT-like text output
function OnChangeHtmlPlugin({
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

function stopPropagation(e: React.KeyboardEvent) {
  e.nativeEvent.stopImmediatePropagation();
}

export type LexicalEditorWrapperProps = {
  id?: string;
  initialText: string;
  backgroundColor?: string;
  onChange: (text: string) => void;
  onBackgroundColorDetected?: (color: string) => void;
  onClick?: () => void;
  onFocus?: (editor: LexicalEditor) => void;
};

const initialConfig = {
  namespace: "CaptionEditor",
  nodes: [
    ColoredTextNode,
    {
      replace: TextNode,
      with: (node: TextNode) => new ColoredTextNode(node.__text),
      withKlass: ColoredTextNode,
    },
  ],
  theme: {
    text: {
      bold: "lexical-bold",
      italic: "lexical-italic",
      underline: "lexical-underline",
    },
  },
  onError: (error: Error) => {
    console.error(error);
  },
};

export function LexicalEditorWrapper({
  id,
  initialText,
  backgroundColor,
  onChange,
  onBackgroundColorDetected,
  onClick,
  onFocus,
}: LexicalEditorWrapperProps) {
  const handleLexicalChange = (newHtml: string) => {
    onChange(newHtml);
  };

  return (
    <EditorTextAreaWrapper onClick={onClick}>
      <LexicalComposer initialConfig={initialConfig}>
        <ContentEditableWrapper
          $borderColor={backgroundColor}
          onKeyDown={stopPropagation}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
        >
          <FocusEmitterPlugin onFocus={onFocus} />
          <RichTextPlugin
            contentEditable={
              <ContentEditable id={id} className="lexical-editor" />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <UnmergeableColorPlugin />
          <HtmlPlugin
            initialHtml={initialText}
            onBackgroundColorDetected={onBackgroundColorDetected}
          />
          <OnChangeHtmlPlugin
            onChange={handleLexicalChange}
            backgroundColor={backgroundColor}
          />
        </ContentEditableWrapper>
      </LexicalComposer>
    </EditorTextAreaWrapper>
  );
}

function ToolbarToggleButton({
  icon: Icon,
  isActive,
  isDisabled,
  onClick,
}: {
  icon: React.ElementType;
  isActive: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="small"
      type="text"
      disabled={isDisabled}
      icon={
        <Icon
          style={{
            color: isDisabled
              ? colors.disabledText
              : isActive
              ? colors.base
              : colors.text,
          }}
        />
      }
      onMouseDown={(e) => {
        e.preventDefault();
        if (!isDisabled) {
          onClick();
        }
      }}
    />
  );
}

export function LexicalStaticToolbar({
  width,
  height,
  editor,
  backgroundColor,
  onBackgroundColorChange,
}: {
  width: number;
  height: number;
  editor: LexicalEditor | null;
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
}) {
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontColor, setFontColor] = useState<string>("");

  const updateToolbar = useCallback(() => {
    if (!editor) {
      setIsTextSelected(false);
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setFontColor("");
      return;
    }
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsTextSelected(!selection.isCollapsed());
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setFontColor(
          $getSelectionStyleValueForProperty(selection, "color", ""),
        );
      } else {
        setIsTextSelected(false);
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setFontColor("");
      }
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      setIsTextSelected(false);
      return;
    }
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  useEffect(() => {
    updateToolbar();
  }, [updateToolbar]);

  useEffect(() => {
    const handleMouseUp = () => updateToolbar();
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [updateToolbar]);

  const handleColorChange: ColorPickerProps["onChangeComplete"] = (color) => {
    if (!editor) return;
    const hexColor = `#${color.toHex()}`;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color: hexColor });
      }
    });
  };

  const handleBgColorChange: ColorPickerProps["onChangeComplete"] = (color) => {
    if (!onBackgroundColorChange) return;
    onBackgroundColorChange(`#${color.toHex()}`);
  };

  const handleClearBgColor = () => {
    if (!onBackgroundColorChange) return;
    onBackgroundColorChange("");
  };

  const getPopupContainer = useCallback(() => {
    return document.getElementById(EDITOR_PORTAL_ELEMENT_ID) || document.body;
  }, []);

  const isDisabled = !editor || !isTextSelected;
  const isBgDisabled = !editor;

  return (
    <StaticToolbarWrapper $width={width} $height={height}>
      <ToolbarToggleButton
        icon={BoldOutlined}
        isDisabled={isDisabled}
        isActive={isBold}
        onClick={() => {
          if (editor) editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
      />
      <ToolbarToggleButton
        icon={ItalicOutlined}
        isDisabled={isDisabled}
        isActive={isItalic}
        onClick={() => {
          if (editor) editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
      />
      <ToolbarToggleButton
        icon={UnderlineOutlined}
        isDisabled={isDisabled}
        isActive={isUnderline}
        onClick={() => {
          if (editor) editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
      />
      <ColorPicker
        size="small"
        value={fontColor || "#000000"}
        disabled={isDisabled}
        onChangeComplete={handleColorChange}
        getPopupContainer={getPopupContainer}
      >
        <Button
          size="small"
          type="text"
          disabled={isDisabled}
          icon={
            <FontColorsOutlined
              style={{
                color: isDisabled
                  ? colors.disabledText
                  : fontColor || colors.text,
              }}
            />
          }
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        />
      </ColorPicker>
      <ColorPicker
        size="small"
        value={backgroundColor || "#252525"}
        disabled={isBgDisabled}
        onChangeComplete={handleBgColorChange}
        getPopupContainer={getPopupContainer}
      >
        <Button
          size="small"
          type="text"
          disabled={isBgDisabled}
          icon={
            <BgColorsOutlined
              style={{
                color: isBgDisabled
                  ? colors.disabledText
                  : backgroundColor || colors.text,
              }}
            />
          }
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        />
      </ColorPicker>
      {backgroundColor && (
        <Button
          size="small"
          type="text"
          icon={
            <CloseOutlined style={{ color: colors.text, fontSize: "10px" }} />
          }
          onMouseDown={(e) => {
            e.preventDefault();
            handleClearBgColor();
          }}
        />
      )}
    </StaticToolbarWrapper>
  );
}
