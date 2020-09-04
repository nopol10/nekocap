import Table from "antd/lib/table/Table";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadPopularCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";

export const PopularCaptions = () => {
  const dispatch = useDispatch();
  const { popularCaptions } = useSelector(publicDashboardSelector);
  const isLoading = useSelector(loadPopularCaptions.isLoading(null));
  useEffect(() => {
    if (popularCaptions.length > 0) {
      return;
    }
    dispatch(loadPopularCaptions.request());
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
        dataSource={popularCaptions}
        pagination={false}
        loading={isLoading}
        locale={{
          emptyText:
            "No captions! You can contribute captions with the extension!",
        }}
      />
    </>
  );
};
