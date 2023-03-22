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
import { setBrowseResults } from "@/common/feature/public-dashboard/actions";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { loadBrowseCaptions } from "@/common/feature/public-dashboard/api";

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
    (store) =>
      async ({
        locale = "en-US",
        params,
      }: GetStaticPropsContext<PageParams>) => {
        try {
          const requestedPageNumber = Math.max(
            1,
            parseInt(params?.pageId || "1") ?? 1
          );
          const { captions, totalCount, hasMoreResults } =
            await loadBrowseCaptions(requestedPageNumber);
          const actualPageNumber =
            totalCount !== undefined && !hasMoreResults
              ? Math.ceil(totalCount / BROWSE_PAGE_SIZE)
              : requestedPageNumber;

          const append = false;
          store.dispatch(
            setBrowseResults({
              hasMoreResults,
              currentResultPage: actualPageNumber,
              pageSize: BROWSE_PAGE_SIZE,
              captions: captions,
              totalResults: totalCount || 0,
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
