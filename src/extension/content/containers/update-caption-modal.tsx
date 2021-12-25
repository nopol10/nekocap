import Form from "antd/lib/form";
import message from "antd/lib/message";
import Modal from "antd/lib/modal/Modal";
import React, { ReactElement, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { CaptionListFields } from "@/common/feature/video/types";
import audioDescriptionImage from "@/assets/images/audio-description.jpg";
import Checkbox from "antd/lib/checkbox";
import { getImageLink } from "@/common/chrome-utils";
import { MediumTag } from "@/common/components/ws-tag";
import { updateUploadedCaption } from "@/common/feature/caption-editor/actions";
import { Input } from "antd";
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

interface UpdateCaptionModalProps {
  caption?: CaptionListFields;
  visible: boolean;
  onCancel: () => void;
}

type FormType = {
  captionId: string;
  translatedTitle?: string;
  hasAudioDescription: boolean;
};

export const UpdateCaptionModal = ({
  caption,
  visible,
  onCancel,
}: UpdateCaptionModalProps): ReactElement => {
  window.tabId = 0;
  const dispatch = useDispatch();
  const isPendingSubmission = useSelector(
    updateUploadedCaption.isLoading(window.tabId)
  );
  const captioner = useSelector(captionerSelector);
  const { handleSubmit, control, errors } = useForm<FormType>();
  const [fileContent, setFileContent] = useState<string>("");
  const [file, setFile] = useState<RcFile>();

  const maxVerifiedUploadSizeMB = MAX_VERIFIED_CAPTION_FILE_BYTES / 1000000;
  const maxNonVerifiedUploadSizeMB = MAX_CAPTION_FILE_BYTES / 1000000;
  const maxPreviewSize = MAX_VERIFIED_CAPTION_FILE_BYTES;
  const isUserVerified = captioner?.captioner?.verified;

  const onSubmit = async (data: FormType) => {
    const { hasAudioDescription, translatedTitle } = data;
    const fileCopy = file ? { ...file } : undefined;
    const nameParts = file ? file.name.split(".") : undefined;
    const fileType = file ? nameParts[nameParts.length - 1] : undefined;
    dispatch(
      updateUploadedCaption.request({
        tabId: window.tabId,
        file: fileCopy,
        type: fileType,
        content: fileContent,
        captionId: caption.id,
        hasAudioDescription,
        translatedTitle,
      })
    )
      .then(() => {
        message.success("Caption successfully updated!");
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
      return;
    }
    const isSizeValid = file.size < maxPreviewSize;
    if (!isSizeValid) {
      message.error(`Caption must smaller than ${maxPreviewSize / 1000000}MB!`);
      return;
    }
    setFile(file);
    return isValidFileType && isSizeValid;
  };

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
            as={Input}
            name={"translatedTitle"}
            dir={"auto"}
            defaultValue={caption?.translatedTitle}
            control={control}
            placeholder={"Translated Title"}
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
            render={({ onChange, name, value, ref }) => (
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
        {errors.translatedTitle && (
          <div style={{ color: colors.error }}>
            Translated title is required!
          </div>
        )}
      </Form>
    </Modal>
  );
};
