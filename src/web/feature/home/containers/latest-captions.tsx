import { loadLatestCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { DEVICE } from "@/common/style-constants";
import { useSSRMediaQuery } from "@/hooks";
import { Spin, Typography } from "antd";
import { useTranslation } from "next-i18next";
import { ReactElement, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CaptionCard } from "../components/caption-card";

import { DataCard } from "../components/data-card";
import { MobileCaptionList } from "../components/mobile-caption-list";

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
  }, [dispatch, latestCaptions.length]);
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });
  const { t } = useTranslation("common");

  const latestCaptionsTitle = t("home.latestCaptions");

  return (
    <>
      {isDesktop && (
        <DataCard title={latestCaptionsTitle}>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div style={{ padding: "16px" }}>
              {latestCaptions.length > 0 ? (
                latestCaptions.map((caption) => (
                  <CaptionCard key={caption.id} caption={caption} />
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  {t("home.noCaptions")}
                </div>
              )}
            </div>
          )}
        </DataCard>
      )}
      {!isDesktop && (
        <>
          <Title level={3}>{latestCaptionsTitle}</Title>
          <MobileCaptionList captions={latestCaptions} />
        </>
      )}
    </>
  );
};
