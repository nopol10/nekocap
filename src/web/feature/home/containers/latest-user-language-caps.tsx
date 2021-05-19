import Table from "antd/lib/table/Table";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadLatestUserLanguageCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";
import { DataCard } from "../components/data-card";
import { getBaseLanguageName } from "@/common/languages";
import { DEVICE } from "@/common/style-constants";
import { MobileCaptionList } from "../components/mobile-caption-list";
import { Typography } from "antd";
import { useSSRMediaQuery } from "@/hooks";

const { Title } = Typography;

export const LatestUserLanguageCaptions = () => {
  const dispatch = useDispatch();
  const { latestUserLanguageCaptions: latestUserLanguageCaptions } =
    useSelector(publicDashboardSelector);
  const isLoading = useSelector(loadLatestUserLanguageCaptions.isLoading(null));
  useEffect(() => {
    if (latestUserLanguageCaptions.length > 0) {
      return;
    }
    dispatch(loadLatestUserLanguageCaptions.request(navigator.language));
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
        <DataCard
          title={`Latest ${getBaseLanguageName(navigator.language)} captions`}
        >
          <Table
            columns={tableColumns}
            dataSource={latestUserLanguageCaptions}
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
          <Title level={3}>Latest user captions</Title>
          <MobileCaptionList captions={latestUserLanguageCaptions} />
        </>
      )}
    </>
  );
};
