import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { Button } from "antd";
import BoldOutlined from "@ant-design/icons/BoldOutlined";
import ItalicOutlined from "@ant-design/icons/ItalicOutlined";
import UnderlineOutlined from "@ant-design/icons/UnderlineOutlined";
import styled from "styled-components";
import { EditorTextAreaWrapper } from "./caption-editor.styled";

const FloatingToolbarWrapper = styled.div`
  position: absolute;
  top: -35px;
  left: 0;
  background: #333;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
  display: flex;
  gap: 5px;
`;

const ContentEditableWrapper = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: 1px solid #d9d9d9;
  font-family: "consolas", monospace;
  background-color: transparent;
  color: inherit;

  .lexical-editor {
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

function FloatingToolbar() {
    const [editor] = useLexicalComposerContext();
    const [isTextSelected, setIsTextSelected] = useState(false);

    const updateToolbar = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const text = selection.getTextContent();
                setIsTextSelected(text.length > 0);
            } else {
                setIsTextSelected(false);
            }
        });
    }, [editor]);

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                updateToolbar();
            });
        });
    }, [editor, updateToolbar]);

    // Handle mouse up outside the editor just in case
    useEffect(() => {
        const handleMouseUp = () => {
            updateToolbar();
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [updateToolbar]);

    if (!isTextSelected) return null;

    return (
        <FloatingToolbarWrapper>
            <Button size="small" type="text" icon={<BoldOutlined style={{ color: 'white' }} />} onMouseDown={(e) => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'); }} />
            <Button size="small" type="text" icon={<ItalicOutlined style={{ color: 'white' }} />} onMouseDown={(e) => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'); }} />
            <Button size="small" type="text" icon={<UnderlineOutlined style={{ color: 'white' }} />} onMouseDown={(e) => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'); }} />
        </FloatingToolbarWrapper>
    );
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
              .replace(/<\/c>/g, '</span>')
              .replace(/<v ([^>]+)>/g, '<span title="$1">')
              .replace(/<\/v>/g, '</span>');

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
function OnChangeHtmlPlugin({ onChange }: { onChange: (html: string) => void }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
                return;
            }
            editorState.read(() => {
                let html = $generateHtmlFromNodes(editor, null);
                html = html.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '\n').trim();
                html = html.replace(/<strong[^>]*>/g, '<b>').replace(/<\/strong>/g, '</b>');
                html = html.replace(/<em[^>]*>/g, '<i>').replace(/<\/em>/g, '</i>');

                onChange(html);
            });
        });
    }, [editor, onChange]);

    return null;
}

export type LexicalEditorWrapperProps = {
    initialText: string;
    onChange: (text: string) => void;
    onClick?: () => void;
};

export function LexicalEditorWrapper({ initialText, onChange, onClick }: LexicalEditorWrapperProps) {
    const initialConfig = {
        namespace: 'CaptionEditor',
        theme: {
            text: {
                bold: 'lexical-bold',
                italic: 'lexical-italic',
                underline: 'lexical-underline',
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
                <ContentEditableWrapper>
                    <FloatingToolbar />
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="lexical-editor" />}
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
