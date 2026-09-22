import fs from "fs";
import Head from "next/head";
import path from "path";
import React from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { Main } from "@/web/feature/home/main";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { PrivacyPolicyPage } from "@/web/feature/privacy-policy/privacy-policy-page";

const TRANSLATION_NAMESPACES = ["common"];

const PRIVACY_POLICY_PATH = "src/web/feature/privacy-policy/privacy-policy.md";

type PrivacyPageProps = {
  content: string;
};

export default function PrivacyPage({
  content,
}: PrivacyPageProps): JSX.Element {
  const metaTitle = "NekoCap - Privacy Policy";
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
        <PrivacyPolicyPage content={content} />
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    () =>
      async ({ locale = "en-US" }: GetStaticPropsContext) => {
        const content = await fs.promises.readFile(
          path.join(process.cwd(), PRIVACY_POLICY_PATH),
          "utf-8",
        );

        return {
          props: {
            ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
            content,
          },
        };
      },
  ),
);
