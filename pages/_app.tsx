import { ANTD_LOCALES } from "@/common/antd-locales";
import { useDayjsLocale } from "@/common/hooks/use-dayjs-locale";
import { ANTD_THEME_CONFIG } from "@/common/styles/antd-theme";
import { wrapper } from "@/web/store/store";
import { ConfigProvider } from "antd";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import nextI18NextConfig from "../next-i18next.config.js";
import "../src/web/feature/home/home.scss";
import "../src/web/styles/index.scss";

function NekoCapApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useDayjsLocale(router.locale);
  return (
    <>
      <ConfigProvider
        locale={
          ANTD_LOCALES[router?.locale || "en-US"] || ANTD_LOCALES["en-US"]
        }
        theme={ANTD_THEME_CONFIG}
      >
        <Component {...pageProps} />
      </ConfigProvider>
    </>
  );
}

export default wrapper.withRedux(
  // @ts-ignore
  appWithTranslation(NekoCapApp, nextI18NextConfig),
);
