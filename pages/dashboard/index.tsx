import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { Main } from "@/web/feature/home/main";
import { OwnProfile } from "@/web/feature/profile/containers/own-profile";
import ProtectedNextComponent from "@/web/feature/protected-next-component";

const TRANSLATION_NAMESPACES = ["common"];

export default function DashboardPage(): JSX.Element {
  const metaTitle = "NekoCap - Dashboard";
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
        <ProtectedNextComponent>
          <OwnProfile />
        </ProtectedNextComponent>
      </Main>
    </>
  );
}

type PageParams = {
  capperId: string;
};

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    (store) => async ({ locale }: GetStaticPropsContext<PageParams>) => {
      return {
        props: {
          ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
        },
      };
    }
  )
);