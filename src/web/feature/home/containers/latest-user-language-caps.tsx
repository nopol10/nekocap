import { loadLatestUserLanguageCaptions } from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { getBaseLanguageName } from "@/common/languages";
import { DEVICE } from "@/common/style-constants";
import { useSSRMediaQuery } from "@/hooks";
import { Spin, Typography } from "antd";
import { useTranslation } from "next-i18next";
import { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CaptionCard } from "../components/caption-card";
import { DataCard } from "../components/data-card";
import { MobileCaptionList } from "../components/mobile-caption-list";

const { Title } = Typography;

export const LatestUserLanguageCaptions = (): ReactElement => {
  const dispatch = useDispatch();
  const { latestUserLanguageCaptions: latestUserLanguageCaptions } =
    useSelector(publicDashboardSelector);
  const isLoading = useSelector(
    loadLatestUserLanguageCaptions.isLoading(undefined),
  );
  const [baseLanguageName, setBaseLanguageName] = useState("");

  useEffect(() => {
    if (latestUserLanguageCaptions.length > 0) {
      return;
    }
    dispatch(loadLatestUserLanguageCaptions.request(navigator.language));
    setBaseLanguageName(getBaseLanguageName(navigator.language));
  }, [dispatch, latestUserLanguageCaptions.length]);

  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });
  const { t } = useTranslation("common");

  return (
    <>
      {isDesktop && (
        <DataCard
          title={t(`home.latestLanguageCaption`, {
            language: baseLanguageName,
          })}
        >
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
              {latestUserLanguageCaptions.length > 0 ? (
                latestUserLanguageCaptions.map((caption) => (
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
