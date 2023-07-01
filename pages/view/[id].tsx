import Head from "next/head";
import React from "react";
import { batch, useSelector } from "react-redux";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { ViewerPage } from "@/web/feature/viewer/viewer-page";
import { useRouter } from "next/router";
import { loadWebsiteViewerCaptionApi } from "@/web/feature/viewer/api";
import {
  loadServerCaption,
  setFontList,
  setLoadedCaption,
  setRenderer,
  setVideoDimensions,
} from "@/common/feature/video/actions";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { Dimension } from "@/common/types";
import { truncate } from "lodash";
import { Main } from "@/web/feature/home/main";
import { RawCaptionData } from "@/common/feature/video/types";
import { loadFontListApi } from "@/common/feature/video/api";
import { STRING_CONSTANTS } from "@/common/string-constants";

const TRANSLATION_NAMESPACES = ["common"];
const TAB_ID = 0;

type ViewCaptionPageProps = {
  rawCaption?: RawCaptionData;
  hasRawCaption: boolean;
};

export default function ViewCaptionPage({
  hasRawCaption = false,
}: ViewCaptionPageProps) {
  const router = useRouter();
  const captionId = router.query.id as string;
  const isEmbed = router.query.embed === "true";
  const tabData = useSelector(tabVideoDataSelector(TAB_ID));
  const hasCaption = () => {
    return tabData && tabData.caption;
  };

  const metaTitle = (() => {
    return hasCaption()
      ? `${tabData?.caption?.translatedTitle} - NekoCap`
      : "NekoCap - Caption not found";
  })();

  const metaDescription = (() => {
    return hasCaption()
      ? `Translated from ${truncate(tabData?.caption?.originalTitle, {
          length: 40,
        })}. NekoCap lets you create and share community captions for online videos. SSA/ASS captions are supported too!`
      : STRING_CONSTANTS.metaDescription;
  })();

  const metaImage = (() => {
    return hasCaption()
      ? `https://i.ytimg.com/vi/${tabData?.caption?.videoId}/hqdefault.jpg`
      : "";
  })();

  const metaUrl = (() => {
    return hasCaption()
      ? `https://nekocap.com/view/${captionId}`
      : "https://nekocap.com";
  })();

  const embedUrl = metaUrl + "?embed=true";

  const viewerPage = (
    <ViewerPage
      captionId={captionId}
      hasRawCaption={hasRawCaption}
      isEmbed={isEmbed}
    />
  );

  return (
    <>
      <Head>
        <>
          <title>{metaTitle}</title>
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta property="og:site_name" content="NekoCap" />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:image" content={metaImage} />
          <meta property="og:url" content={metaUrl} />
          <meta property="og:video:type" content="text/html" />
          <meta property="og:video:url" content={embedUrl} />
          <meta property="og:video:secure_url" content={embedUrl} />
          <meta property="og:video:height" content="720" />
          <meta property="og:video:width" content="1280" />
          <meta property="og:type" content="video.other" />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={metaImage} />
          <meta name="twitter:player" content={embedUrl} />
          <meta name="twitter:card" content="player" />
          <meta name="twitter:site" content="@NekoCaption" />
          <meta name="twitter:player:width" content="640" />
          <meta name="twitter:player:height" content="360" />
        </>
      </Head>
      {isEmbed && viewerPage}
      {!isEmbed && <Main>{viewerPage}</Main>}
    </>
  );
}

type PageParams = {
  id: string;
};

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    (store) =>
      async ({
        locale = "en-US",
        params = { id: "" },
      }: GetStaticPropsContext<PageParams>) => {
        let hasRawCaption = false;
        try {
          const { id: captionId } = params;
          const response = await loadWebsiteViewerCaptionApi(captionId);
          const fontList = await loadFontListApi();
          const { caption, renderer } = response;
          hasRawCaption = !!response.rawCaption;
          const tabId = TAB_ID;

          const processor = videoSourceToProcessorMap[caption.videoSource];
          const dimensions: Dimension = await processor.retrieveVideoDimensions(
            caption.videoId
          );
          console.log(`[view] retrieved props for: ${captionId}`);
          batch(() => {
            store.dispatch(setFontList({ list: fontList }));
            store.dispatch(setLoadedCaption({ tabId, caption }));
            store.dispatch(setRenderer({ tabId, renderer }));
            store.dispatch(setVideoDimensions({ tabId, dimensions }));
            store.dispatch(loadServerCaption.success());
          });
        } catch (e) {
          console.error("Error during viewer page generation", e);
        }

        return {
          props: {
            ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
            hasRawCaption,
          },
          revalidate: 60,
        };
      }
  )
);
