import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
} from "lexical";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
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
import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";

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
