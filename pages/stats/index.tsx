import Head from "next/head";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import ProtectedNextComponent from "@/web/feature/protected-next-component";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { Locator } from "@/common/locator/locator";
import { statsActions } from "@/common/feature/stats/slice";

const DynamicGlobalStats = dynamic(
  () => import("../../src/web/feature/stats/container/global-stats"),
  { ssr: false }
);

const TRANSLATION_NAMESPACES = ["common"];

export default function StatsPage(): JSX.Element {
  const metaTitle = "NekoCap - Stats";
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
          <DynamicGlobalStats />
        </ProtectedNextComponent>
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    (store) => async ({ locale }: GetStaticPropsContext) => {
      try {
        const {
          status,
          error,
          result,
        } = await Locator.provider().getGlobalStats();
        if (status === "error") {
          throw new Error(error);
        }
        store.dispatch(statsActions.setGlobalStats(result));
      } catch (e) {
        console.error("Error during browse caption page generation", e);
      }

      return {
        props: {
          ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
        },
        revalidate: 120,
      };
    }
  )
);
