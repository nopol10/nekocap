import * as React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LexicalEditor, TextNode } from "lexical";
import styled from "styled-components";
import { darkModeSelector } from "@/common/processor-utils";
import { EditorTextAreaWrapper } from "../caption-editor.styled";
import { ColoredTextNode } from "./colored-text-node";
import {
  FocusEmitterPlugin,
  HtmlPlugin,
  OnChangeHtmlPlugin,
  UnmergeableColorPlugin,
} from "./plugins";

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

// Prevents the editor-level hotkey handler (use-caption-editor-hotkeys) from
// firing while the user is typing inside a caption.
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
          <OnChangeHtmlPlugin onChange={onChange} />
        </ContentEditableWrapper>
      </LexicalComposer>
    </EditorTextAreaWrapper>
  );
}
