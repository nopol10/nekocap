import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import ProtectedNextComponent from "@/web/feature/protected-next-component";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { UserSettings } from "@/web/feature/profile/containers/user-settings";

const TRANSLATION_NAMESPACES = ["common"];

export default function NewCaptionerPage(): JSX.Element {
  const metaTitle = "NekoCap - Settings";
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
        <ProtectedNextComponent>
          <UserSettings />
        </ProtectedNextComponent>
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(() => async ({ locale }: GetStaticPropsContext) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
    };
  })
);
