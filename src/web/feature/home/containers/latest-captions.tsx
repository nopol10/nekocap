import Table from "antd/lib/table/Table";
import { Typography } from "antd";
import React, { ReactElement, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";
import { DEVICE } from "@/common/style-constants";
import { DataCard } from "../components/data-card";
import { MobileCaptionList } from "../components/mobile-caption-list";
import { loadLatestCaptions } from "@/common/feature/public-dashboard/actions";
import { useSSRMediaQuery } from "@/hooks";
import { useTranslation } from "next-i18next";

const { Title } = Typography;

export const LatestCaptions = (): ReactElement => {
  const dispatch = useDispatch();
  const { latestCaptions } = useSelector(publicDashboardSelector);
  const isLoading = useSelector(loadLatestCaptions.isLoading(undefined));
  useEffect(() => {
    if (latestCaptions.length > 0) {
      return;
    }
    dispatch(loadLatestCaptions.request());
  }, []);
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });
  const { t } = useTranslation("common");

  const tableColumns = [
    captionColumns.thumbnail,
    captionColumns.videoName,
    captionColumns.captioner,
    captionColumns.fromToLanguage,
    captionColumns.videoSource,
    captionColumns.createdDate,
  ];
  const noCaptionsTitle = t("home.latestCaptions");

  return (
    <>
      {isDesktop && (
        <DataCard title={noCaptionsTitle}>
          <Table
            columns={tableColumns}
            dataSource={latestCaptions}
            pagination={false}
            loading={isLoading}
            rowKey={"id"}
            locale={{
              emptyText: t("home.noCaptions"),
            }}
          />
        </DataCard>
      )}
      {!isDesktop && (
        <>
          <Title level={3}>{noCaptionsTitle}</Title>
          <MobileCaptionList captions={latestCaptions} />
        </>
      )}
    </>
  );
};
