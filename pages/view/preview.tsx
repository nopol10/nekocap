import { STRING_CONSTANTS } from "@/common/string-constants";
import { getNekoCapWebsiteUrl } from "@/common/client-utils";
import { Main } from "@/web/feature/home/main";
import { CaptionPreviewPage } from "@/web/feature/viewer/caption-preview-page";
import {
  fetchPreviewVideoMetadata,
  parsePreviewVideoParams,
  PreviewVideoMetadata,
} from "@/web/feature/viewer/preview-metadata";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { wrapper } from "@/web/store/store";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";

const TRANSLATION_NAMESPACES = ["common"];

type PreviewCaptionPageProps = {
  videoMetadata: PreviewVideoMetadata | null;
};

export default function PreviewCaptionPage({
  videoMetadata,
}: PreviewCaptionPageProps) {
  const router = useRouter();
  const isEmbed = router.query.embed === "true";

  const previewPage = <CaptionPreviewPage isEmbed={isEmbed} />;

  const metaTitle = videoMetadata?.title
    ? `${videoMetadata.title} - NekoCap caption preview`
    : "NekoCap - Caption preview";

  const metaDescription = videoMetadata
    ? "A caption preview on NekoCap. Open the link to watch the video with these captions."
    : STRING_CONSTANTS.metaDescription;

  const metaImage = videoMetadata?.thumbnailUrl || "";

  // The caption payload lives in the hash, which is not available here, so the
  // shared URL is rebuilt from the query params the unfurler did send. Anyone
  // opening it still gets their captions: the hash travels with the link in
  // the client, it is only invisible to the server.
  const websiteUrl = (getNekoCapWebsiteUrl() || "https://nekocap.com").replace(
    /\/+$/,
    "",
  );
  const metaUrl = videoMetadata
    ? `${websiteUrl}/view/preview?v=${encodeURIComponent(
        videoMetadata.videoId,
      )}&s=${videoMetadata.videoSource}`
    : `${websiteUrl}/view/preview`;
  const embedUrl = `${metaUrl}&embed=true`;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta property="og:site_name" content="NekoCap" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={metaUrl} />
        {!!metaImage && <meta property="og:image" content={metaImage} />}
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {!!metaImage && <meta name="twitter:image" content={metaImage} />}
        <meta name="twitter:site" content="@NekoCaption" />
        {!!videoMetadata && (
          <>
            <meta property="og:type" content="video.other" />
            <meta property="og:video:type" content="text/html" />
            <meta property="og:video:url" content={embedUrl} />
            <meta property="og:video:secure_url" content={embedUrl} />
            <meta property="og:video:width" content="1280" />
            <meta property="og:video:height" content="720" />
            <meta name="twitter:card" content="player" />
            <meta name="twitter:player" content={embedUrl} />
            <meta name="twitter:player:width" content="640" />
            <meta name="twitter:player:height" content="360" />
          </>
        )}
        {!videoMetadata && <meta name="twitter:card" content="summary" />}
      </Head>
      {isEmbed && previewPage}
      {!isEmbed && <Main>{previewPage}</Main>}
    </>
  );
}

// Rendered per request rather than statically: the meta tags depend on the
// `v` query param, which getStaticProps does not receive. Preview links are
// unique and unfurled once, so there is nothing for caching to save here.
export const getServerSideProps: GetServerSideProps =
  NextWrapper.getServerSideProps(
    wrapper.getServerSideProps(
      () =>
        async ({ locale = "en-US", query }: GetServerSidePropsContext) => {
          const videoParams = parsePreviewVideoParams(query);
          const videoMetadata = videoParams
            ? await fetchPreviewVideoMetadata(videoParams)
            : null;
          return {
            props: {
              ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
              videoMetadata,
            },
          };
        },
    ),
  );
