import Form from "antd/lib/form";
import message from "antd/lib/message";
import Modal from "antd/lib/modal/Modal";
import React, { ReactElement, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  CaptionListFields,
  CaptionPrivacy,
  CaptionTag,
} from "@/common/feature/video/types";
import audioDescriptionImage from "@/assets/images/audio-description.jpg";
import Checkbox from "antd/lib/checkbox";
import { getImageLink } from "@/common/chrome-utils";
import { MediumTag } from "@/common/components/ws-tag";
import { updateUploadedCaption } from "@/common/feature/caption-editor/actions";
import { Divider, Input, Select } from "antd";
import { colors } from "@/common/colors";
import { captionTags, WEBEXT_ERROR_MESSAGE } from "@/common/constants";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { UploadCaptionBlock } from "../components/upload-caption-block";
import { RcFile } from "antd/lib/upload";
import {
  MAX_CAPTION_FILE_BYTES,
  MAX_VERIFIED_CAPTION_FILE_BYTES,
  SUPPORTED_FILE_TYPES_STRING,
  VALID_FILE_TYPES,
} from "@/common/feature/caption-editor/constants";
import { hasTag } from "@/common/caption-utils";
import { isServer } from "@/common/client-utils";
import { getPrivacyEnums } from "@/common/feature/caption-editor/get-privacy-enums";
import { CaptionTagEditor } from "../components/caption-tag-editor";
import {
  getCaptionTagFromTagString,
  getCaptionTagStrings,
} from "@/common/feature/video/utils";
import { BooleanFilter } from "@/common/utils";

interface UpdateCaptionModalProps {
  caption?: CaptionListFields;
  visible: boolean;
  onCancel: () => void;
  onUpdated: (captionId: string) => void;
}

type FormType = {
  captionId: string;
  translatedTitle?: string;
  hasAudioDescription: boolean;
  privacy: CaptionPrivacy;
  selectedTagNames: string[];
};

export const UpdateCaptionModal = (
  props: UpdateCaptionModalProps,
): ReactElement => {
  if (isServer() || !props.caption) {
    return <></>;
  }
  return (
    <UpdateCaptionModalClient
      {...props}
      caption={props.caption}
    ></UpdateCaptionModalClient>
  );
};

// For frontend use only
export const UpdateCaptionModalClient = ({
  caption,
  visible,
  onCancel,
  onUpdated,
}: UpdateCaptionModalProps & { caption: CaptionListFields }): ReactElement => {
  globalThis.tabId = 0;
  const dispatch = useDispatch();
  const isPendingSubmission = useSelector(
    updateUploadedCaption.isLoading(globalThis.tabId),
  );
  const captioner = useSelector(captionerSelector);
  const {
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
    watch,
  } = useForm<FormType>();
  const [fileContent, setFileContent] = useState<string>("");
  const [file, setFile] = useState<RcFile>();

  const maxVerifiedUploadSizeMB = MAX_VERIFIED_CAPTION_FILE_BYTES / 1000000;
  const maxNonVerifiedUploadSizeMB = MAX_CAPTION_FILE_BYTES / 1000000;
  const maxPreviewSize = MAX_VERIFIED_CAPTION_FILE_BYTES;
  const isUserVerified = !!captioner?.captioner?.verified;
  const { selectedTagNames } = watch();

  const onSubmit = async (data: FormType) => {
    const { hasAudioDescription, translatedTitle, privacy, selectedTagNames } =
      data;
    const fileCopy = file
      ? Object.assign(Object.create(Object.getPrototypeOf(file)), file)
      : undefined;
    const nameParts = file ? file.name.split(".") : undefined;
    const fileType =
      file && nameParts ? nameParts[nameParts.length - 1] : undefined;
    const selectedTags = getCaptionTagStrings(
      userCaptionTags.filter((tag) => selectedTagNames.indexOf(tag.name) >= 0),
    );
    dispatch(
      updateUploadedCaption.request({
        tabId: globalThis.tabId,
        file: fileCopy,
        type: fileType,
        content: fileContent,
        captionId: caption.id,
        hasAudioDescription,
        translatedTitle,
        selectedTags,
        privacy,
      }),
    )
      .then(() => {
        message.success("Caption successfully updated!");
        onUpdated(caption.id);
        onCancel();
      })
      .catch((e) => {
        const errorMessage =
          e.message && e.message.replace
            ? e.message.replace(WEBEXT_ERROR_MESSAGE, "")
            : "";
        message.error(`Error updating caption: ${errorMessage}`);
        onCancel();
      });
  };

  const beforeUpload = (file: RcFile): boolean => {
    const extension = file.name
      .substring(file.name.lastIndexOf(".") + 1)
      .toLowerCase();
    const isValidFileType = VALID_FILE_TYPES.includes(extension);
    if (!isValidFileType) {
      message.error(`You can only load ${SUPPORTED_FILE_TYPES_STRING} files!`);
      return false;
    }
    const isSizeValid = file.size < maxPreviewSize;
    if (!isSizeValid) {
      message.error(`Caption must smaller than ${maxPreviewSize / 1000000}MB!`);
      return false;
    }
    setFile(file);
    return isValidFileType && isSizeValid;
  };

  const [userCaptionTags, setUserCaptionTags] = useState<CaptionTag[]>([]);
  useEffect(() => {
    setUserCaptionTags(
      (captioner.captioner?.captionTags || [])
        .map(getCaptionTagFromTagString)
        .filter(BooleanFilter),
    );
  }, [captioner]);

  const handleNewAddTag = (tagName: string, color: string) => {
    const updatedTags = [...userCaptionTags];
    const existingTag = userCaptionTags.find((tag) => tag.name === tagName);
    if (existingTag) {
      existingTag.color = color;
    } else {
      updatedTags.push({ name: tagName, color });
    }
    const selectedTagNames = getValues("selectedTagNames") || [];
    if (selectedTagNames.indexOf(tagName) >= 0) {
      return;
    }
    // This updates the control
    setValue("selectedTagNames", [...selectedTagNames, tagName]);
    setUserCaptionTags(updatedTags);
  };

  const defaultUserTags =
    caption?.tags
      ?.map((tag) => {
        const captionTag = getCaptionTagFromTagString(tag);
        return captionTag?.name;
      })
      .filter(BooleanFilter) || [];

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      okText={"Update"}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isPendingSubmission}
      title={"Caption details"}
    >
      <Form key={caption?.id}>
        <Form.Item label="Translated Title" labelCol={{ span: 24 }}>
          <Controller
            render={({ field }) => (
              <Input {...field} dir={"auto"} placeholder={"Translated Title"} />
            )}
            name={"translatedTitle"}
            defaultValue={caption?.translatedTitle}
            control={control}
            rules={{ required: true }}
          />
        </Form.Item>
        <UploadCaptionBlock
          beforeUpload={beforeUpload}
          file={file}
          isUserVerified={isUserVerified}
          maxNonVerifiedUploadSizeMB={maxNonVerifiedUploadSizeMB}
          maxVerifiedUploadSizeMB={maxVerifiedUploadSizeMB}
          setFileContent={setFileContent}
        />
        <Form.Item label="Has Audio Description">
          <Controller
            render={({ field: { onChange, name, value, ref } }) => (
              <Checkbox
                onChange={(event) => {
                  onChange(event.target.checked);
                }}
                name={name}
                ref={ref}
                checked={value}
              >
                <MediumTag src={getImageLink(audioDescriptionImage)} />
              </Checkbox>
            )}
            name={"hasAudioDescription"}
            defaultValue={
              caption
                ? hasTag(caption?.tags, captionTags.audioDescribed)
                : false
            }
            control={control}
          />
        </Form.Item>
        <Divider orientation="left" style={{ fontSize: 14 }}>
          Tags
        </Divider>
        <Form.Item>
          <CaptionTagEditor
            defaultTags={defaultUserTags}
            control={control}
            onAddTag={handleNewAddTag}
            existingTags={userCaptionTags}
            selectedTagNames={selectedTagNames}
          ></CaptionTagEditor>
        </Form.Item>
        <Divider />
        <Form.Item label="Privacy">
          <Controller
            render={({ field }) => (
              <Select {...field} size={"middle"} placeholder={"Privacy"}>
                {getPrivacyEnums()}
              </Select>
            )}
            name={"privacy"}
            control={control}
            defaultValue={caption?.privacy}
          ></Controller>
        </Form.Item>
        {errors.translatedTitle && (
          <div style={{ color: colors.error }}>
            Translated title is required!
          </div>
        )}
      </Form>
    </Modal>
  );
};
