import React, { ReactElement, useMemo, useState } from "react";
import type { CustomTagProps } from "rc-select/lib/BaseSelect";
import Select from "antd/lib/select";
import Tag from "antd/lib/tag";
import { Input, message, Popover, Space } from "antd";
import { Control, Controller, FieldValue, FieldValues } from "react-hook-form";
import { ColorResult, SketchPicker } from "react-color";
import { CaptionTag } from "@/common/feature/video/types";
import styled from "styled-components";
import { WSButton } from "@/common/components/ws-button";
import { MAX_CAPTION_GROUP_TAG_LIMIT } from "@/common/feature/video/constants";

const ColorPickerTrigger = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${({ $color }) => $color};
  border-radius: 4px;
`;

export type NewTagProps = {
  disabled: boolean;
  onAddTag: (tagName: string, color: string) => void;
};

export const NewTag = ({ disabled, onAddTag }: NewTagProps): ReactElement => {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#e7b93b");
  const handleClickAddTag = () => {
    if (!newTagName) {
      message.error("Please enter a tag name!");
      return;
    }
    onAddTag(newTagName, newTagColor);
  };
  const handleChangeNewTagName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(e.target.value);
  };

  const handleSetNewTagColor = (color: ColorResult) => {
    setNewTagColor(color.hex);
  };

  return (
    <div>
      <Space>
        <div>New tag:</div>
        <Input
          name="newTagName"
          dir="auto"
          placeholder="Tag name: e.g. Interviews"
          value={newTagName}
          onChange={handleChangeNewTagName}
          maxLength={64}
        ></Input>
        <Popover
          title={"Color"}
          content={
            <div style={{ userSelect: "none" }}>
              <SketchPicker
                color={newTagColor}
                onChange={handleSetNewTagColor}
                styles={{
                  default: {
                    picker: {
                      boxShadow: "none",
                    },
                  },
                }}
              />
            </div>
          }
        >
          <ColorPickerTrigger $color={newTagColor}></ColorPickerTrigger>
        </Popover>
        <WSButton size="small" onClick={handleClickAddTag} disabled={disabled}>
          Add tag
        </WSButton>
      </Space>
    </div>
  );
};

export type CaptionTagEditorProps = {
  defaultTags: string[];
  existingTags: CaptionTag[];
  selectedTagNames: string[];
  control: Control<any>;
  onAddTag: (tagName: string, color: string) => void;
};

export const CaptionTagEditor = ({
  defaultTags,
  existingTags = [],
  selectedTagNames,
  control,
  onAddTag,
}: CaptionTagEditorProps): ReactElement => {
  const tagOptions = useMemo(() => {
    return existingTags.map((tag) => {
      return {
        value: tag.name,
        disabled:
          selectedTagNames?.length >= MAX_CAPTION_GROUP_TAG_LIMIT &&
          !selectedTagNames?.find(
            (selectedTag) => selectedTag.indexOf(tag.name) >= 0,
          ),
      };
    });
  }, [existingTags, selectedTagNames]);

  const renderTag = ({
    label,
    value,
    closable,
    onClose,
  }: CustomTagProps & { value: string }) => {
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const color =
      existingTags.find((tag) => tag.name === value)?.color || "#ffffff";
    return (
      <Tag
        color={color}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Controller
          render={({ field }) => {
            return (
              <Select
                {...field}
                mode="multiple"
                showSearch
                showArrow
                tagRender={renderTag}
                placeholder={"Tags"}
                options={tagOptions}
                style={{ width: "100%" }}
                notFoundContent={"No tags"}
              />
            );
          }}
          name={"selectedTagNames"}
          control={control}
          defaultValue={defaultTags}
          rules={{ required: false }}
        />
        <NewTag
          disabled={selectedTagNames?.length >= MAX_CAPTION_GROUP_TAG_LIMIT}
          onAddTag={onAddTag}
        />
      </Space>
    </>
  );
};
