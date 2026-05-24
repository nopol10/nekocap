import {
  loadLatestCaptions,
  loadLatestUserLanguageCaptions,
} from "@/common/feature/public-dashboard/actions";
import { publicDashboardSelector } from "@/common/feature/public-dashboard/selectors";
import { getBaseLanguageCode } from "@/common/languages";
import React, { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { KofiWidget } from "../common/containers/kofi-widget";
import { BrowseCTA } from "./components/browse-cta";
import { FeaturesGrid } from "./components/features-grid";
import { IntroSplit } from "./components/intro-split";
import { SitesMarquee } from "./components/sites-marquee";
import { StatsStrip } from "./components/stats-strip";
import { YourLangRail } from "./components/your-lang-rail";

export const Home = (): ReactElement => {
  const dispatch = useDispatch();
  const { latestCaptions, latestUserLanguageCaptions } = useSelector(
    publicDashboardSelector,
  );
  const isLoadingLatest = useSelector(loadLatestCaptions.isLoading(undefined));
  const isLoadingLang = useSelector(
    loadLatestUserLanguageCaptions.isLoading(undefined),
  );
  const [langOverride, setLangOverride] = useState<string | null>(null);

  useEffect(() => {
    if (latestCaptions.length === 0) {
      dispatch(loadLatestCaptions.request());
    }
  }, []);

  useEffect(() => {
    const lang = navigator.language;
    setLangOverride(getBaseLanguageCode(lang));
    if (latestUserLanguageCaptions.length === 0) {
      dispatch(loadLatestUserLanguageCaptions.request(lang));
    }
  }, []);

  return (
    <>
      <KofiWidget />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginTop: "-64px",
        }}
      >
        <IntroSplit
          captions={latestCaptions.slice(0, 6)}
          isLoading={isLoadingLatest}
        />
        <SitesMarquee />
        <FeaturesGrid />
        <StatsStrip />
        <YourLangRail
          captions={latestUserLanguageCaptions}
          isLoading={isLoadingLang}
          langOverride={langOverride}
        />
        <BrowseCTA />
      </div>
    </>
  );
};
