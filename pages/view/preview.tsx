import { Main } from "@/web/feature/home/main";
import { CaptionPreviewPage } from "@/web/feature/viewer/caption-preview-page";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { wrapper } from "@/web/store/store";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";

const TRANSLATION_NAMESPACES = ["common"];

export default function PreviewCaptionPage() {
  const router = useRouter();
  const isEmbed = router.query.embed === "true";

  const previewPage = <CaptionPreviewPage isEmbed={isEmbed} />;

  return (
    <>
      <Head>
        <title>NekoCap - Caption preview</title>
        <meta name="robots" content="noindex" />
      </Head>
      {isEmbed && previewPage}
      {!isEmbed && <Main>{previewPage}</Main>}
    </>
  );
}

// The caption data lives in the URL hash fragment, which never reaches the
// server, so this page has no server-side data requirements
export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(() => async ({ locale = "en-US" }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
    };
  }),
);
