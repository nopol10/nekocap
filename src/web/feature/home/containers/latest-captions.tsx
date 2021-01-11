import Table from "antd/lib/table/Table";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadLatestCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";

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
        dataSource={latestCaptions}
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
