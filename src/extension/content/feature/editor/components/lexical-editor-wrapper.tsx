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
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
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

const ContentEditableWrapper = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 1px solid #d9d9d9;
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

  useEffect(() => {
    if (!onFocus) return;
    return editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        onFocus(editor);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onFocus]);

  return null;
}

// Plugin to parse initial HTML (WebVTT strings converted to HTML)
function HtmlPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (!isFirstRender) return;
    setIsFirstRender(false);
    editor.update(() => {
      const parser = new DOMParser();
      // Pre-process webvtt tags
      let processedHtml = initialHtml || "";
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

      const dom = parser.parseFromString(processedHtml, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, initialHtml, isFirstRender]);

  return null;
}

// Mark TextNodes with color styles as unmergeable so Lexical keeps them
// as separate nodes and doesn't merge the color into format tags (strong/em).
function UnmergeableColorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (node) => {
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
function OnChangeHtmlPlugin({
  onChange,
}: {
  onChange: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Helper: extract hex color from a computed style color value
    const extractHexColor = (value: string): string | null => {
      // Match hex color directly
      const hexMatch = value.match(/#([0-9a-fA-F]{3,8})\b/);
      if (hexMatch) return `#${hexMatch[1]}`;
      // Match rgb/rgba
      const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (rgbMatch) {
        return (
          "#" +
          [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
            .map((c) => parseInt(c, 10).toString(16).padStart(2, "0"))
            .join("")
        );
      }
      return null;
    };

    // Recursively serialize a DOM node to the WebVTT-like output format
    const serializeNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const childContent = Array.from(el.childNodes)
        .map(serializeNode)
        .join("");
      const style = el.getAttribute("style") || "";
      const color = extractHexColor(style);
      let outputTag = "";
      switch (tag) {
        case "br":
          return "\n";
        case "p":
          // Flatten <p> blocks into text separated by newlines
          return childContent + "\n";
        case "strong":
          outputTag = "b";
          break;
        case "em":
        case "i":
          outputTag = "i";
          break;
        case "u":
          outputTag = "u";
          break;
        case "span": {
          if (color) {
            outputTag = "nc";
          }
          // Strip spans without a valid color
          // return childContent;
          break;
        }
        default:
          // For any other tags (b, i, etc.), pass through as-is
          if (el.children.length === 0 && !childContent) {
            return "";
          }
          outputTag = "";
      }
      if (!outputTag) {
        return childContent;
      }
      let outputStyle = "";
      if (style) {
        outputStyle = ` style="${style}"`;
      }
      return `<${outputTag}${outputStyle}>${childContent}</${outputTag}>`;
    };

    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }
        editorState.read(() => {
          // Convert Lexical editor nodes to HTML string
          const rawHtml = $generateHtmlFromNodes(editor, null);

          // Parse with DOMParser for accurate traversal
          const parser = new DOMParser();
          const doc = parser.parseFromString(rawHtml, "text/html");

          // Serialize the parsed body back to our output format
          const html = Array.from(doc.body.childNodes)
            .map(serializeNode)
            .join("")
            .trim();

          onChange(html);
        });
      },
    );
  }, [editor, onChange]);

  return null;
}

function stopPropagation(e: React.KeyboardEvent) {
  e.nativeEvent.stopImmediatePropagation();
}

export type LexicalEditorWrapperProps = {
  id?: string;
  initialText: string;
  onChange: (text: string) => void;
  onClick?: () => void;
  onFocus?: (editor: LexicalEditor) => void;
};

const initialConfig = {
  namespace: "CaptionEditor",
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
  onChange,
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
          <HtmlPlugin initialHtml={initialText} />
          <OnChangeHtmlPlugin onChange={handleLexicalChange} />
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
}: {
  width: number;
  height: number;
  editor: LexicalEditor | null;
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

  const getPopupContainer = useCallback(() => {
    return document.getElementById(EDITOR_PORTAL_ELEMENT_ID) || document.body;
  }, []);

  const isDisabled = !editor || !isTextSelected;

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
        disabledAlpha
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
    </StaticToolbarWrapper>
  );
}
