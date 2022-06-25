import Table from "antd/lib/table/Table";
import React, { ReactElement, useEffect, useState } from "react";
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
import { useTranslation } from "next-i18next";

const { Title } = Typography;

export const LatestUserLanguageCaptions = (): ReactElement => {
  const dispatch = useDispatch();
  const {
    latestUserLanguageCaptions: latestUserLanguageCaptions,
  } = useSelector(publicDashboardSelector);
  const isLoading = useSelector(loadLatestUserLanguageCaptions.isLoading(null));
  const [baseLanguageName, setBaseLanguageName] = useState("");
  useEffect(() => {
    if (latestUserLanguageCaptions.length > 0) {
      return;
    }
    dispatch(loadLatestUserLanguageCaptions.request(navigator.language));
    setBaseLanguageName(getBaseLanguageName(navigator.language));
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

  return (
    <>
      {isDesktop && (
        <DataCard
          title={t(`home.latestLanguageCaption`, {
            language: baseLanguageName,
          })}
        >
          <Table
            columns={tableColumns}
            dataSource={latestUserLanguageCaptions}
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
          <Title level={3}>
            {t(`home.latestLanguageCaption`, {
              language: baseLanguageName,
            })}
          </Title>
          <MobileCaptionList captions={latestUserLanguageCaptions} />
        </>
      )}
    </>
  );
};
