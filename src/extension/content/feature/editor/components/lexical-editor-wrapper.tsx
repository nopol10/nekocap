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
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { Button } from "antd";
import BoldOutlined from "@ant-design/icons/BoldOutlined";
import ItalicOutlined from "@ant-design/icons/ItalicOutlined";
import UnderlineOutlined from "@ant-design/icons/UnderlineOutlined";
import styled from "styled-components";
import { EditorTextAreaWrapper } from "./caption-editor.styled";

const StaticToolbarWrapper = styled.div`
  display: flex;
  gap: 5px;
  padding: 8px 16px;
  background-color: rgb(37, 37, 37);
  border-top: 1px solid #333;
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

// Convert Lexical's internal AST back to WebVTT-like text output
function OnChangeHtmlPlugin({
  onChange,
}: {
  onChange: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }
        editorState.read(() => {
          let html = $generateHtmlFromNodes(editor, null);
          html = html
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<p[^>]*>/g, "")
            .replace(/<\/p>/g, "\n")
            .trim();
          html = html
            .replace(/<strong[^>]*>/g, "<b>")
            .replace(/<\/strong>/g, "</b>");
          html = html.replace(/<em[^>]*>/g, "<i>").replace(/<\/em>/g, "</i>");
          html = html.replace(/<span[^>]*>/g, "").replace(/<\/span>/g, "");

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

export function LexicalEditorWrapper({
  id,
  initialText,
  onChange,
  onClick,
  onFocus,
}: LexicalEditorWrapperProps) {
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
          <HtmlPlugin initialHtml={initialText} />
          <OnChangeHtmlPlugin onChange={handleLexicalChange} />
        </ContentEditableWrapper>
      </LexicalComposer>
    </EditorTextAreaWrapper>
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

  const updateToolbar = useCallback(() => {
    if (!editor) {
      setIsTextSelected(false);
      return;
    }
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsTextSelected(!selection.isCollapsed());
      } else {
        setIsTextSelected(false);
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

  const isDisabled = !editor || !isTextSelected;

  return (
    <StaticToolbarWrapper style={{ width, height }}>
      <Button
        size="small"
        type="text"
        disabled={isDisabled}
        icon={<BoldOutlined style={{ color: isDisabled ? "gray" : "white" }} />}
        onMouseDown={(e) => {
          e.preventDefault();
          if (editor && !isDisabled) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          }
        }}
      />
      <Button
        size="small"
        type="text"
        disabled={isDisabled}
        icon={
          <ItalicOutlined style={{ color: isDisabled ? "gray" : "white" }} />
        }
        onMouseDown={(e) => {
          e.preventDefault();
          if (editor && !isDisabled) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          }
        }}
      />
      <Button
        size="small"
        type="text"
        disabled={isDisabled}
        icon={
          <UnderlineOutlined style={{ color: isDisabled ? "gray" : "white" }} />
        }
        onMouseDown={(e) => {
          e.preventDefault();
          if (editor && !isDisabled) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          }
        }}
      />
    </StaticToolbarWrapper>
  );
}
