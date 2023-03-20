import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Home } from "@/web/feature/home/home";
import { wrapper } from "@/web/store/store";
import { loadLatestCaptionsApi } from "@/common/feature/public-dashboard/api";
import { setLatestCaptions } from "@/common/feature/public-dashboard/actions";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps } from "next";
import { Main } from "@/web/feature/home/main";

const TRANSLATION_NAMESPACES = ["common", "landing"];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>
          NekoCap - open source web video community captioning extension
        </title>
      </Head>
      <Main>
        <Home />
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps((store) => async ({ locale = "en-US" }) => {
    try {
      const latestCaptions = await loadLatestCaptionsApi();
      store.dispatch(setLatestCaptions(latestCaptions));
    } catch (e) {
      console.error("Error during homepage generation", e);
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
      revalidate: 60,
    };
  })
);
