import Head from "next/head";
import React from "react";
import { batch, useSelector } from "react-redux";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ViewerPage } from "@/web/feature/viewer/viewer-page";
import { useRouter } from "next/router";
import { loadWebsiteViewerCaptionApi } from "@/web/feature/viewer/api";
import {
  loadServerCaption,
  setLoadedCaption,
  setRenderer,
  setVideoDimensions,
} from "@/common/feature/video/actions";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { Dimension } from "@/common/types";
import { truncate } from "lodash";
import { Main } from "@/web/feature/home/main";

const TRANSLATION_NAMESPACES = ["common"];
const TAB_ID = 0;

export default function ViewCaptionPage() {
  const router = useRouter();
  const captionId = router.query.id as string;
  const tabData = useSelector(tabVideoDataSelector(TAB_ID));
  const hasCaption = () => {
    return tabData && tabData.caption;
  };

  const metaTitle = (() => {
    return hasCaption()
      ? `${tabData.caption.translatedTitle} - NekoCap`
      : "NekoCap - Caption not found";
  })();

  const metaDescription = (() => {
    return hasCaption()
      ? `Translated from ${truncate(tabData.caption.originalTitle, {
          length: 40,
        })}. NekoCap lets you create and share community captions for online videos. SSA/ASS captions are supported too!`
      : "Create and upload captions for YouTube, niconico and Vimeo videos with NekoCap";
  })();

  const metaImage = (() => {
    return hasCaption()
      ? `https://i.ytimg.com/vi/${tabData.caption.videoId}/hqdefault.jpg`
      : "";
  })();

  const metaUrl = (() => {
    return hasCaption()
      ? `https://nekocap.com/view/${captionId}`
      : "https://nekocap.com";
  })();

  return (
    <>
      <Head>
        <>
          <title>{metaTitle}</title>
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:image" content={metaImage} />
          <meta property="og:url" content={metaUrl} />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={metaImage} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@NekoCaption"></meta>
        </>
      </Head>
      <Main>
        <ViewerPage captionId={captionId} />
      </Main>
    </>
  );
}

type PageParams = {
  id: string;
};

export const getServerSideProps: GetServerSideProps =
  NextWrapper.getServerSideProps(
    wrapper.getServerSideProps(
      (store) =>
        async ({ locale, params }: GetServerSidePropsContext<PageParams>) => {
          try {
            const { id: captionId } = params;
            const { caption, rawCaption, renderer } =
              await loadWebsiteViewerCaptionApi(captionId);
            const tabId = TAB_ID;

            const processor = videoSourceToProcessorMap[caption.videoSource];
            const dimensions: Dimension =
              await processor.retrieveVideoDimensions(caption.videoId);

            batch(() => {
              store.dispatch(setLoadedCaption({ tabId, caption, rawCaption }));
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
            },
          };
        }
    )
  );
