import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import {
  BrowseCaptionPage,
  BROWSE_PAGE_SIZE,
} from "@/web/feature/browse/containers/browse-caption-page";
import { BrowseResults } from "@/common/feature/public-dashboard/types";
import { Locator } from "@/common/locator/locator";
import { setBrowseResults } from "@/common/feature/public-dashboard/actions";
import { STRING_CONSTANTS } from "@/common/string-constants";

const TRANSLATION_NAMESPACES = ["common"];

export default function BrowseAllCaptionsPage(): JSX.Element {
  const metaTitle = "NekoCap - Browse Captions";
  const metaDescription = STRING_CONSTANTS.metaDescription;

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

type PageParams = {
  pageId: string;
};

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    (store) => async ({
      locale,
      params,
    }: GetStaticPropsContext<PageParams>) => {
      try {
        const requestedPageNumber = Math.max(1, parseInt(params.pageId) ?? 1);
        const {
          status,
          error,
          captions,
          hasMoreResults,
          totalCount,
        }: BrowseResults = await Locator.provider().browse({
          limit: BROWSE_PAGE_SIZE,
          offset: (requestedPageNumber - 1) * BROWSE_PAGE_SIZE,
        });
        if (status === "error") {
          throw new Error(error);
        }
        const actualPageNumber =
          totalCount !== undefined && !hasMoreResults
            ? Math.ceil(totalCount / BROWSE_PAGE_SIZE)
            : requestedPageNumber;

        const append = false;
        const paddedCaptions = [
          ...new Array(BROWSE_PAGE_SIZE * (actualPageNumber - 1)).fill(null),
          ...captions,
        ];
        store.dispatch(
          setBrowseResults({
            hasMoreResults,
            currentResultPage: actualPageNumber,
            pageSize: BROWSE_PAGE_SIZE,
            captions: paddedCaptions,
            append,
          })
        );
      } catch (e) {
        console.error("Error during browse caption page generation", e);
      }

      return {
        props: {
          ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
        },
        revalidate: 60,
      };
    }
  )
);

export const getStaticPaths: GetStaticPaths<PageParams> = () => {
  return {
    paths: [{ params: { pageId: "1" } }],
    fallback: "blocking",
  };
};