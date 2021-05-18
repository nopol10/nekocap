import Head from "next/head";
import React from "react";
import { batch } from "react-redux";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps } from "next";
import { Main } from "@/web/feature/home/main";
import { BrowseCaptionPage } from "@/web/feature/browse/containers/browse-caption-page";
import { BrowseResults } from "@/common/feature/public-dashboard/types";
import { Locator } from "@/common/locator/locator";
import { setBrowseResults } from "@/common/feature/public-dashboard/actions";

const TRANSLATION_NAMESPACES = ["common"];

export default function BrowseAllCaptionsPage(): JSX.Element {
  const metaTitle = "NekoCap - Browse Captions";
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
        <BrowseCaptionPage />
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps((store) => async ({ locale }) => {
    try {
      const {
        status,
        error,
        captions,
        hasMoreResults,
      }: BrowseResults = await Locator.provider().browse({
        limit: 20,
        offset: 0,
      });
      if (status === "error") {
        throw new Error(error);
      }

      const pageNumber = 1;
      const append = false;

      batch(() => {
        store.dispatch(
          setBrowseResults({
            hasMoreResults,
            currentResultPage: pageNumber,
            captions,
            append,
          })
        );
      });
    } catch (e) {
      console.error("Error during browse caption page generation", e);
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
    };
  })
);
