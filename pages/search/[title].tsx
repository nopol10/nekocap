import Head from "next/head";
import React from "react";
import { batch, useSelector } from "react-redux";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { Main } from "@/web/feature/home/main";
import {
  populateVideoDetails,
  searchCaptionsApi,
} from "@/common/feature/search/api";
import { VideoFields } from "@/common/feature/video/types";
import { setSearchResults } from "@/common/feature/search/actions";
import { SearchCaptions } from "@/web/feature/search/search-captions";

const TRANSLATION_NAMESPACES = ["common"];

export default function SearchCaptionsPage(): JSX.Element {
  const router = useRouter();
  const title = router.query.title as string;

  const metaTitle = `NekoCap - Results for '${title}'`;

  const metaDescription =
    "Create and upload captions for YouTube, niconico and Vimeo videos with NekoCap";

  const metaUrl = `https://nekocap.com/search/${title}`;

  return (
    <>
      <Head>
        <>
          <title>{metaTitle}</title>
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={metaUrl} />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@NekoCaption"></meta>
        </>
      </Head>
      <Main>
        <SearchCaptions title={title} />
      </Main>
    </>
  );
}

type PageParams = {
  title: string;
};

export const getServerSideProps: GetServerSideProps =
  NextWrapper.getServerSideProps(
    wrapper.getServerSideProps(
      (store) =>
        async ({ locale, params }: GetServerSidePropsContext<PageParams>) => {
          const { title } = params;
          try {
            const PAGE_NUMBER = 1;
            const { videos, hasMoreResults } = await searchCaptionsApi(
              title,
              20,
              PAGE_NUMBER
            );

            const videosWithDetails: VideoFields[] = await populateVideoDetails(
              videos
            );

            store.dispatch(
              setSearchResults({
                hasMoreResults,
                currentResultPage: PAGE_NUMBER,
                videos: videosWithDetails,
                append: false,
              })
            );
          } catch (e) {
            console.error("Error during search page generation", e);
          }

          return {
            props: {
              ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
            },
          };
        }
    )
  );