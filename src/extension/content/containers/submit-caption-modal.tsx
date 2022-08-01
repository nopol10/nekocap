import Form from "antd/lib/form";
import message from "antd/lib/message";
import Modal from "antd/lib/modal/Modal";
import Select from "antd/lib/select";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { CaptionPrivacy, VideoMeta } from "@/common/feature/video/types";
import audioDescriptionImage from "@/assets/images/audio-description.jpg";
import Checkbox from "antd/lib/checkbox";
import { getImageLink } from "@/common/chrome-utils";
import { MediumTag } from "@/common/components/ws-tag";
import { languageOptions } from "@/common/language-utils";
import { submitCaption } from "@/common/feature/caption-editor/actions";
import { Input } from "antd";
import { colors } from "@/common/colors";
import { DISCORD_INVITE_URL, WEBEXT_ERROR_MESSAGE } from "@/common/constants";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { getVideoTitle } from "../processors/processor";
import { getPrivacyEnums } from "@/common/feature/caption-editor/get-privacy-enums";

interface SubmitCaptionModalProps {
  visible: boolean;
  onCancel: () => void;
}

type FormType = {
  languageCode: string;
  translatedTitle: string;
  videoLanguageCode: string;
  hasAudioDescription: boolean;
  privacy: CaptionPrivacy;
};

export const SubmitCaptionModal = ({
  visible,
  onCancel,
}: SubmitCaptionModalProps) => {
  const dispatch = useDispatch();
  const isPendingSubmission = useSelector(
    submitCaption.isLoading(window.tabId)
  );
  const captioner = useSelector(captionerSelector);

  const { handleSubmit, control, errors } = useForm<FormType>();

  const onSubmit = async (data: FormType) => {
    const {
      languageCode,
      hasAudioDescription,
      videoLanguageCode,
      translatedTitle,
      privacy,
    } = data;
    if (window.selectedProcessor.updateTitleOnSubmission) {
      window.videoName = await getVideoTitle(window.selectedProcessor);
    }
    const video: VideoMeta = {
      id: window.videoId,
      source: window.videoSource,
      name: window.videoName,
      languageCode: videoLanguageCode,
    };
    dispatch(
      submitCaption.request({
        tabId: window.tabId,
        languageCode,
        video,
        translatedTitle,
        hasAudioDescription,
        privacy,
      })
    )
      .then(() => {
        message.success("Caption successfully uploaded!");
        onCancel();
      })
      .catch((e) => {
        const errorMessage =
          e.message && e.message.replace
            ? e.message.replace(WEBEXT_ERROR_MESSAGE, "")
            : "";
        message.error(`Error uploading caption: ${errorMessage}`);
        onCancel();
      });
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      okText={"Submit"}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isPendingSubmission}
      title={"Caption details"}
    >
      <Form>
        <Form.Item label="Caption Language" labelCol={{ span: 24 }}>
          <Controller
            as={Select}
            name={"languageCode"}
            control={control}
            showSearch
            size={"large"}
            placeholder={"Language"}
            filterOption={(input, option) =>
              option.props.children
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0 ||
              option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            rules={{ required: true }}
          >
            {languageOptions}
          </Controller>
        </Form.Item>
        <Form.Item label="Original Video Language" labelCol={{ span: 24 }}>
          <Controller
            as={Select}
            name={"videoLanguageCode"}
            control={control}
            showSearch
            size={"large"}
            placeholder={"Original Video Language"}
            filterOption={(input, option) =>
              option.props.children
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0 ||
              option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {languageOptions}
          </Controller>
        </Form.Item>
        <Form.Item label="Translated Title" labelCol={{ span: 24 }}>
          <Controller
            as={Input}
            name={"translatedTitle"}
            dir={"auto"}
            defaultValue={""}
            control={control}
            placeholder={"Translated Title"}
            rules={{ required: true }}
          />
        </Form.Item>
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
            control={control}
          />
        </Form.Item>
        <Form.Item label="Privacy">
          <Controller
            as={Select}
            name={"privacy"}
            control={control}
            size={"middle"}
            defaultValue={CaptionPrivacy.Public}
            placeholder={"Privacy"}
          >
            {getPrivacyEnums()}
          </Controller>
        </Form.Item>
        {errors.languageCode && (
          <div style={{ color: colors.error }}>Language code is required!</div>
        )}
        {errors.translatedTitle && (
          <div style={{ color: colors.error }}>
            Translated title is required!
          </div>
        )}
        {!captioner.captioner?.verified && (
          <div>
            Since you are unverified, you will need to wait 5 minutes between
            submissions. Join the{" "}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
              Discord server
            </a>{" "}
            to get verified.
          </div>
        )}
      </Form>
    </Modal>
  );
};
