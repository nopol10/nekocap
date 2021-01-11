import Table from "antd/lib/table/Table";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadLatestUserLanguageCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";

export const LatestUserLanguageCaptions = () => {
  const dispatch = useDispatch();
  const {
    latestUserLanguageCaptions: latestUserLanguageCaptions,
  } = useSelector(publicDashboardSelector);
  const isLoading = useSelector(loadLatestUserLanguageCaptions.isLoading(null));
  useEffect(() => {
    if (latestUserLanguageCaptions.length > 0) {
      return;
    }
    dispatch(loadLatestUserLanguageCaptions.request(navigator.language));
  }, []);

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
    </>
  );
};
