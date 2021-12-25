import type { RcFile } from "antd/lib/upload";
import Dragger from "antd/lib/upload/Dragger";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import React, { ReactElement } from "react";
import Link from "antd/lib/typography/Link";
import { DISCORD_INVITE_URL } from "@/common/constants";
import { SUPPORTED_FILE_TYPES_STRING } from "@/common/feature/caption-editor/constants";

export type UploadCaptionBlockProps = {
  beforeUpload: (file: RcFile) => boolean;
  file: RcFile;
  isUserVerified: boolean;
  maxVerifiedUploadSizeMB: number;
  maxNonVerifiedUploadSizeMB: number;
  setFileContent: (content: string) => void;
};

export const UploadCaptionBlock = ({
  beforeUpload,
  file,
  isUserVerified,
  maxVerifiedUploadSizeMB,
  maxNonVerifiedUploadSizeMB,
  setFileContent,
}: UploadCaptionBlockProps): ReactElement => {
  const dummyRequest = (options: UploadRequestOption) => {
    const { onSuccess } = options;
    if (!file) {
      return;
    }
    onSuccess(file, new XMLHttpRequest());
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent((reader.result as string) || "");
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div>Supported file types: {SUPPORTED_FILE_TYPES_STRING}</div>
      <Dragger
        listType="picture-card"
        showUploadList={false}
        beforeUpload={beforeUpload}
        name={"caption"}
        customRequest={dummyRequest}
      >
        {file && file.name}
        {!file && <div>Drop the caption file here!</div>}
      </Dragger>
      <div style={{ marginTop: 16 }}>
        {isUserVerified && (
          <div>Max upload size: {maxVerifiedUploadSizeMB}MB</div>
        )}
        {!isUserVerified && (
          <>
            <div>
              Non-verified users can upload up to {maxNonVerifiedUploadSizeMB}{" "}
              MB
            </div>
            <div>
              Verified users can upload up to {maxVerifiedUploadSizeMB} MB
            </div>
            <div>
              Join the <Link href={DISCORD_INVITE_URL}>Discord</Link> server to
              get verified
            </div>
          </>
        )}
      </div>
    </>
  );
};
