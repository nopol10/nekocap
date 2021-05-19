import Table from "antd/lib/table/Table";
import { Typography } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";
import { DEVICE } from "@/common/style-constants";
import { DataCard } from "../components/data-card";
import { MobileCaptionList } from "../components/mobile-caption-list";
import { loadLatestCaptions } from "@/common/feature/public-dashboard/actions";
import { useSSRMediaQuery } from "@/hooks";

const { Title } = Typography;

export const LatestCaptions = () => {
  const dispatch = useDispatch();
  const { latestCaptions } = useSelector(publicDashboardSelector);
  const isLoading = useSelector(loadLatestCaptions.isLoading(null));
  useEffect(() => {
    if (latestCaptions.length > 0) {
      return;
    }
    dispatch(loadLatestCaptions.request());
  }, []);
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });

  const tableColumns = [
    captionColumns.thumbnail,
    captionColumns.videoName,
    captionColumns.captioner,
    captionColumns.fromToLanguage,
    captionColumns.videoSource,
    captionColumns.createdDate,
  ];

  return (
    <>
      {isDesktop && (
        <DataCard title={"Latest captions"}>
          <Table
            columns={tableColumns}
            dataSource={latestCaptions}
            pagination={false}
            loading={isLoading}
            rowKey={"id"}
            locale={{
              emptyText:
                "No captions! You can contribute captions with the extension!",
            }}
          />
        </DataCard>
      )}
      {!isDesktop && (
        <>
          <Title level={3}>Latest captions</Title>
          <MobileCaptionList captions={latestCaptions} />
        </>
      )}
    </>
  );
};
