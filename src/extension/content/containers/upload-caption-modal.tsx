import {
  MAX_CAPTION_FILE_BYTES,
  MAX_VERIFIED_CAPTION_FILE_BYTES,
  SUPPORTED_FILE_TYPES_STRING,
  VALID_FILE_TYPES,
} from "@/common/feature/caption-editor/constants";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { Form, message, Modal } from "antd";
import type { RcFile } from "antd/lib/upload";
import { ReactElement, useState } from "react";
import { useSelector } from "react-redux";
import { UploadCaptionBlock } from "../components/upload-caption-block";

interface SelectFileModalProps {
  visible: boolean;
  onCancel: () => void;
  onDone: (file: RcFile, contents: string) => void;
  afterClose: () => void;
}

export const SelectFileModal = ({
  visible,
  onCancel,
  onDone,
  afterClose,
}: SelectFileModalProps): ReactElement => {
  const captioner = useSelector(captionerSelector);
  const [fileContent, setFileContent] = useState<string>("");
  const [file, setFile] = useState<RcFile>();

  const maxVerifiedUploadSizeMB = MAX_VERIFIED_CAPTION_FILE_BYTES / 1000000;
  const maxNonVerifiedUploadSizeMB = MAX_CAPTION_FILE_BYTES / 1000000;
  const maxPreviewSize = MAX_VERIFIED_CAPTION_FILE_BYTES;
  const isUserVerified = !!captioner?.captioner?.verified;

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

  const handleSubmit = () => {
    if (file) {
      onDone(file, fileContent);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      okText={"Load"}
      onOk={handleSubmit}
      title={"Select a caption file or drop it into the box below"}
      afterClose={afterClose}
    >
      <Form>
        <UploadCaptionBlock
          beforeUpload={beforeUpload}
          file={file}
          isUserVerified={isUserVerified}
          maxNonVerifiedUploadSizeMB={maxNonVerifiedUploadSizeMB}
          maxVerifiedUploadSizeMB={maxVerifiedUploadSizeMB}
          setFileContent={setFileContent}
        />
      </Form>
    </Modal>
  );
};
