import { isClient } from "@/common/client-utils";
import { setInWebEditor } from "@/common/feature/caption-editor/actions";
import { VideoSource } from "@/common/feature/video/types";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { CaptionEditorPage } from "@/web/feature/caption-editor/caption-editor-page";
import { AutoLoginProvider } from "@/web/feature/common/contexts/auto-login-context";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { wrapper } from "@/web/store/store";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";

const TRANSLATION_NAMESPACES = ["common"];

export default function CreateCaptionPage(): JSX.Element {
  const metaTitle = "NekoCap - Create Caption";
  const metaDescription = STRING_CONSTANTS.metaDescription;
  const router = useRouter();
  router.query;
  const videoId = router.query["videoId"] as string | null;
  const videoSourceString = router.query["videoSource"] as string;
  if ((videoId === null || videoSourceString === null) && isClient()) {
    // TODO: go to home until create page is implemented
    router.push("/");
    return <></>;
  }
  const videoSource = parseInt(
    videoSourceString || VideoSource.NekoCapYoutube.toString(),
  );

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
      <AutoLoginProvider withLoggedInUserCaptions={true}>
        <CaptionEditorPage videoId={videoId || ""} videoSource={videoSource} />
      </AutoLoginProvider>
    </>
  );
}

type PageParams = {
  capperId: string;
};

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(
    (store) =>
      async ({ locale = "en-US" }: GetStaticPropsContext<PageParams>) => {
        store.dispatch(setInWebEditor(true));
        return {
          props: {
            ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
          },
        };
      },
  ),
);
