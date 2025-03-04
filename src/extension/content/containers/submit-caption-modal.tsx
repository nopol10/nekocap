import audioDescriptionImage from "@/assets/images/audio-description.jpg";
import { getImageLink } from "@/common/chrome-utils";
import { colors } from "@/common/colors";
import { WSSpace } from "@/common/components/ws-space";
import { MediumTag } from "@/common/components/ws-tag";
import { DISCORD_INVITE_URL, WEBEXT_ERROR_MESSAGE } from "@/common/constants";
import { submitCaption } from "@/common/feature/caption-editor/actions";
import { getPrivacyEnums } from "@/common/feature/caption-editor/get-privacy-enums";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { CaptionPrivacy, VideoMeta } from "@/common/feature/video/types";
import { languageOptions } from "@/common/language-utils";
import { getDirectCaptionLoadLink } from "@/common/processor-utils";
import { UploadResult } from "@/common/types";
import CheckCircleFilled from "@ant-design/icons/CheckCircleFilled";
import CopyOutlined from "@ant-design/icons/CopyOutlined";
import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Select,
  Tooltip,
  Typography,
} from "antd";
import { useCallback, useState } from "react";
import { Control, Controller, FieldErrors, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getVideoTitle } from "../processors/processor";

const { Text, Link } = Typography;
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

export const SubmitCaptionModal = (props: SubmitCaptionModalProps) => {
  const { visible, onCancel } = props;
  const dispatch = useDispatch();
  const isPendingSubmission = useSelector(
    submitCaption.isLoading(globalThis.tabId),
  );
  const [newCaptionId, setNewCaptionId] = useState<string | undefined>(
    undefined,
  );

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormType>();

  const onSubmit = async (data: FormType) => {
    const {
      languageCode,
      hasAudioDescription,
      videoLanguageCode,
      translatedTitle,
      privacy,
    } = data;
    if (globalThis.selectedProcessor?.updateTitleOnSubmission) {
      globalThis.videoName = await getVideoTitle(globalThis.selectedProcessor);
    }
    const video: VideoMeta = {
      id: globalThis.videoId,
      source: globalThis.videoSource,
      name: globalThis.videoName,
      languageCode: videoLanguageCode,
    };
    dispatch(
      submitCaption.request({
        tabId: globalThis.tabId,
        languageCode,
        video,
        translatedTitle,
        hasAudioDescription,
        privacy,
      }),
    )
      .then((response: UploadResult) => {
        setNewCaptionId(response.captionId);
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
  const onClose = useCallback(() => {
    setNewCaptionId(undefined);
    onCancel();
  }, []);

  return (
    <>
      <Modal
        open={visible}
        onCancel={newCaptionId ? onClose : onCancel}
        cancelButtonProps={
          newCaptionId ? { style: { display: "none" } } : undefined
        }
        okText={newCaptionId ? "Close" : "Submit"}
        onOk={newCaptionId ? onClose : handleSubmit(onSubmit)}
        confirmLoading={isPendingSubmission}
        title={
          newCaptionId ? (
            <>
              Caption uploaded successfully{" "}
              <CheckCircleFilled style={{ fontSize: 16, color: colors.like }} />
            </>
          ) : (
            "Caption details"
          )
        }
      >
        {!newCaptionId && (
          <FormScreen {...props} control={control} errors={errors}></FormScreen>
        )}
        {newCaptionId && (
          <SuccessfulScreen captionId={newCaptionId}></SuccessfulScreen>
        )}
      </Modal>
    </>
  );
};

function FormScreen({
  control,
  errors,
}: {
  control: Control<FormType>;
  errors: FieldErrors<FormType>;
}) {
  const captioner = useSelector(captionerSelector);

  return (
    <Form>
      <Form.Item label="Caption Language" labelCol={{ span: 24 }}>
        <Controller
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              size={"large"}
              placeholder={"Language"}
              filterOption={(input, option) =>
                option.props.children
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0 ||
                option.props.value.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
              }
            >
              {languageOptions}
            </Select>
          )}
          name={"languageCode"}
          control={control}
          rules={{ required: true }}
        ></Controller>
      </Form.Item>
      <Form.Item label="Original Video Language" labelCol={{ span: 24 }}>
        <Controller
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              size={"large"}
              placeholder={"Original Video Language"}
              filterOption={(input, option) =>
                option.props.children
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0 ||
                option.props.value.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
              }
            >
              {languageOptions}
            </Select>
          )}
          name={"videoLanguageCode"}
          control={control}
        ></Controller>
      </Form.Item>
      <Form.Item label="Translated Title" labelCol={{ span: 24 }}>
        <Controller
          render={({ field }) => (
            <Input {...field} dir={"auto"} placeholder={"Translated Title"} />
          )}
          name={"translatedTitle"}
          defaultValue={""}
          control={control}
          rules={{ required: true }}
        />
      </Form.Item>
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
          control={control}
        />
      </Form.Item>
      <Form.Item label="Privacy">
        <Controller
          render={({ field }) => (
            <Select {...field} placeholder={"Privacy"} size={"middle"}>
              {getPrivacyEnums()}
            </Select>
          )}
          name={"privacy"}
          control={control}
          defaultValue={CaptionPrivacy.Public}
        />
      </Form.Item>
      {errors.languageCode && (
        <div style={{ color: colors.error }}>Language code is required!</div>
      )}
      {errors.translatedTitle && (
        <div style={{ color: colors.error }}>Translated title is required!</div>
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
  );
}

type SuccessfulScreenProps = {
  captionId: string;
};

const SuccessLink = styled(Link)`
  padding: 6px;
  border: 1px dashed black;
`;

function SuccessfulScreen({ captionId }: SuccessfulScreenProps) {
  const directViewUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}view/${captionId}`;
  const extensionViewUrl = globalThis.selectedProcessor
    ? getDirectCaptionLoadLink(
        globalThis.selectedProcessor,
        globalThis.videoId,
        captionId,
      )
    : undefined;
  const handleClickCopyDirectLink = () => {
    navigator?.clipboard?.writeText(directViewUrl);
    message.info("Copied caption link to clipboard!");
  };
  const handleClickCopyExtensionLink = () => {
    if (!extensionViewUrl) {
      return;
    }
    navigator?.clipboard?.writeText(extensionViewUrl);
    message.info("Copied watch link to clipboard!");
  };
  return (
    <WSSpace $direction="vertical">
      <Text>
        <b>Share</b> this direct view link with your viewers (📱 & 💻):
      </Text>
      <WSSpace $direction="horizontal">
        <SuccessLink href={directViewUrl} target="_blank">
          {directViewUrl}
        </SuccessLink>
        <Tooltip title="Copy View URL">
          <Button
            icon={<CopyOutlined />}
            type={"link"}
            onClick={handleClickCopyDirectLink}
          />
        </Tooltip>
      </WSSpace>
      {extensionViewUrl && (
        <>
          <Text>
            <b>Watch</b> through the extension with this link:
          </Text>
          <WSSpace $direction="horizontal">
            <SuccessLink href={extensionViewUrl} target="_blank">
              {extensionViewUrl}
            </SuccessLink>
            <Tooltip title="Copy Watch URL">
              <Button
                icon={<CopyOutlined />}
                type={"link"}
                onClick={handleClickCopyExtensionLink}
              />
            </Tooltip>
          </WSSpace>
        </>
      )}
    </WSSpace>
  );
}
