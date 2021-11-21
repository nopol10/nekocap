import Head from "next/head";
import React from "react";
import { batch } from "react-redux";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps } from "next";
import { Main } from "@/web/feature/home/main";
import { loadFontListApi } from "@/common/feature/video/api";
import { setFontList } from "@/common/feature/video/actions";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { FontListPage } from "@/web/feature/font-list/font-list-page";

const TRANSLATION_NAMESPACES = ["common"];

export default function FontsPage(): JSX.Element {
  const metaTitle = "NekoCap - Available Fonts";
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
        <FontListPage />
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps((store) => async ({ locale }) => {
    try {
      const fontList = await loadFontListApi();

      batch(() => {
        store.dispatch(setFontList({ list: fontList }));
      });
    } catch (e) {
      console.error("Error during font list page generation", e);
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
      revalidate: 60,
    };
  })
);
