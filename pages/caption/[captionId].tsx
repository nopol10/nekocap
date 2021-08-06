import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import { loadCaptionForReviewApi } from "@/web/feature/caption-review/api";
import { setReviewData } from "@/common/feature/caption-review/actions";
import { CaptionReview } from "@/web/feature/caption-review/caption-review";

const TRANSLATION_NAMESPACES = ["common"];

export default function CaptionDetailsPage(): JSX.Element {
  const metaTitle = "NekoCap - Review Caption";
  const metaDescription =
    "Create and upload captions for YouTube, niconico and Vimeo videos with NekoCap";

  return (
    <>
      <Head>
        <>
          <title>{metaTitle}</title>
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:site" content="@NekoCaption"></meta>
        </>
      </Head>
      <Main>
        <CaptionReview />
      </Main>
    </>
  );
}

type PageParams = {
  captionId: string;
};

export const getServerSideProps: GetServerSideProps = NextWrapper.getServerSideProps(
  wrapper.getServerSideProps(
    (store) => async ({
      locale,
      params,
    }: GetServerSidePropsContext<PageParams>) => {
      try {
        const { captionId } = params;
        const caption = await loadCaptionForReviewApi(captionId);
        store.dispatch(setReviewData(caption));
      } catch (e) {
        console.error("Error during caption review page generation", e);
      }

      return {
        props: {
          ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
        },
      };
    }
  )
);
