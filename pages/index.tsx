import {
  setLatestCaptions,
  setLatestUserLanguageCaptions,
} from "@/common/feature/public-dashboard/actions";
import {
  loadLatestCaptionsApi,
  loadLatestUserLanguageCaptionsApi,
} from "@/common/feature/public-dashboard/api";
import { Home } from "@/web/feature/home/home";
import { Main } from "@/web/feature/home/main";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { wrapper } from "@/web/store/store";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";

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
      const latestLanguageCaptions =
        await loadLatestUserLanguageCaptionsApi(locale);
      store.dispatch(setLatestCaptions(latestCaptions));
      store.dispatch(setLatestUserLanguageCaptions(latestLanguageCaptions));
    } catch (e) {
      console.error("Error during homepage generation", e);
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
      revalidate: 90,
    };
  }),
);
