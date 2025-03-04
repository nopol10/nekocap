import { isServer } from "@/common/client-utils";
import { LoadCaptionsResult, VideoSource } from "@/common/feature/video/types";
import { Modal, Table, TableColumnsType } from "antd";
import { useTranslation } from "next-i18next";
import { ReactElement } from "react";
import { videoCaptionColumns } from "../common/components/data-columns";

interface VideoCaptionModalProps {
  captions: LoadCaptionsResult[];
  videoId: string;
  videoSource: VideoSource;
  visible: boolean;
  isLoading: boolean;
  onCancel: () => void;
}

export const VideoCaptionModal = ({
  captions,
  videoId,
  videoSource,
  visible,
  isLoading,
  onCancel,
}: VideoCaptionModalProps): ReactElement => {
  const { t } = useTranslation("common");

  if (isServer()) {
    return <></>;
  }
  const videoColumns = videoCaptionColumns(videoId, videoSource);
  const tableColumns: TableColumnsType<LoadCaptionsResult> = [
    videoColumns.language,
    videoColumns.captioner,
  ].filter(Boolean);

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      title={t("home.search.availableCaptions")}
      footer={null}
      bodyStyle={{ padding: 0 }}
    >
      <Table
        columns={tableColumns}
        dataSource={captions}
        loading={isLoading}
        rowKey={"id"}
        pagination={{ style: { paddingRight: "6px" } }}
        locale={{
          emptyText: t("home.search.noCaptionsFoundForVideo"),
        }}
      />
    </Modal>
  );
};
