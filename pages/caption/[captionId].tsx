import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import { CaptionReview } from "@/web/feature/caption-review/caption-review";
import { STRING_CONSTANTS } from "@/common/string-constants";
import ProtectedNextComponent from "@/web/feature/protected-next-component";

const TRANSLATION_NAMESPACES = ["common"];

export default function CaptionDetailsPage(): JSX.Element {
  const metaTitle = "NekoCap - Review Caption";
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
          <CaptionReview />
        </ProtectedNextComponent>
      </Main>
    </>
  );
}

type PageParams = {
  captionId: string;
};

export const getServerSideProps: GetServerSideProps = NextWrapper.getServerSideProps(
  wrapper.getServerSideProps(
    () => async ({ locale }: GetServerSidePropsContext<PageParams>) => {
      return {
        props: {
          ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
        },
      };
    }
  )
);
