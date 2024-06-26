import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import { CaptionerProfile } from "@/web/feature/profile/containers/captioner-profile";
import { loadCaptionerProfileApi } from "@/web/feature/profile/api";
import { setProfile } from "@/common/feature/profile/actions";
import { STRING_CONSTANTS } from "@/common/string-constants";

const TRANSLATION_NAMESPACES = ["common"];

export default function CaptionerDetailsPage(): JSX.Element {
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
        <CaptionerProfile />
      </Main>
    </>
  );
}

type PageParams = {
  capperId: string;
};

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    (store) =>
      async ({
        locale = "en-US",
        params = { capperId: "" },
      }: GetStaticPropsContext<PageParams>) => {
        try {
          const { capperId } = params;
          const profile = await loadCaptionerProfileApi(capperId);
          if (profile.captioner) {
            store.dispatch(setProfile(profile));
          }
        } catch (e) {
          console.error("Error during profile page generation", e);
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

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};
