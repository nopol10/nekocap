import Head from "next/head";
import React, { ReactNode } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { UseTranslation, useTranslation } from "next-i18next";
import { Home } from "@/web/feature/home/home";

const TRANSLATION_NAMESPACES = ["common", "landing"];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>
          NekoCap - open source web video community captioning extension
        </title>
      </Head>
      <Home />
    </>
  );
}

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
    },
  };
};
