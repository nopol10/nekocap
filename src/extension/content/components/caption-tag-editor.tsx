import type { RcFile } from "antd/lib/upload";
import Dragger from "antd/lib/upload/Dragger";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import React, { ReactElement, useMemo, useState } from "react";
import type { CustomTagProps } from "rc-select/lib/interface/generator";
import Select from "antd/lib/select";
import Tag from "antd/lib/tag";
import { Card, Form, Input, message, Popover, Space, Typography } from "antd";
import { Control, Controller } from "react-hook-form";
import { Color, ColorResult, SketchPicker } from "react-color";
import { CaptionTag } from "@/common/feature/video/types";
import styled from "styled-components";
import { WSButton } from "@/common/components/ws-button";

const { Text } = Typography;

const ColorPickerTrigger = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${({ $color }) => $color};
  border-radius: 4px;
`;

export type NewTagProps = {
  onAddTag: (tagName: string, color: string) => void;
};

export const NewTag = ({ onAddTag }: NewTagProps): ReactElement => {
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
        <WSButton size="small" onClick={handleClickAddTag}>
          Add tag
        </WSButton>
      </Space>
    </div>
  );
};

export type CaptionTagEditorProps = {
  existingTags: CaptionTag[];
  control: Control;
  onAddTag: (tagName: string, color: string) => void;
};

export const CaptionTagEditor = ({
  existingTags = [],
  control,
  onAddTag,
}: CaptionTagEditorProps): ReactElement => {
  const tagOptions = useMemo(() => {
    return existingTags.map((tag) => {
      return {
        value: tag.name,
      };
    });
  }, [existingTags]);

  const tagRender = (props: CustomTagProps & { value: string }) => {
    const { label, value, closable, onClose } = props;
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
          as={Select}
          name={"selectedTagNames"}
          mode="multiple"
          control={control}
          showSearch
          showArrow
          tagRender={tagRender}
          placeholder={"Tags"}
          defaultValue={[]}
          options={tagOptions}
          style={{ width: "100%" }}
          rules={{ required: false }}
        />
        <NewTag onAddTag={onAddTag} />
      </Space>
    </>
  );
};
