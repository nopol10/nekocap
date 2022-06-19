import Table from "antd/lib/table/Table";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadPopularCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { captionColumns } from "../../common/components/data-columns";
import { useTranslation } from "next-i18next";

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
  const { t } = useTranslation("common");

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
          emptyText: t("home.noCaptions"),
        }}
      />
    </>
  );
};
