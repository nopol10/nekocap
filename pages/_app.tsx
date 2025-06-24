import { ANTD_LOCALES } from "@/common/antd-locales";
import { useDarkMode } from "@/common/hooks/use-dark-mode";
import { useDayjsLocale } from "@/common/hooks/use-dayjs-locale";
import { ServerReactQueryProvider } from "@/common/providers/react-query-provider";
import { ANTD_THEME_CONFIG } from "@/common/styles/antd-theme";
import { wrapper } from "@/web/store/store";
import { HydrationBoundary } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import nextI18NextConfig from "../next-i18next.config.js";
import "../src/web/feature/home/home.scss";
import "../src/web/styles/index.scss";

function NekoCapApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useDayjsLocale(router.locale);

  const [deviceInDarkMode] = useDarkMode();
  const canUseDarkMode =
    deviceInDarkMode && router.pathname.startsWith("/create");
  return (
    <ServerReactQueryProvider>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <ConfigProvider
          locale={
            ANTD_LOCALES[router?.locale || "en-US"] || ANTD_LOCALES["en-US"]
          }
          theme={{
            ...ANTD_THEME_CONFIG,
            algorithm: canUseDarkMode
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          }}
        >
          <Component {...pageProps} />
        </ConfigProvider>
      </HydrationBoundary>
    </ServerReactQueryProvider>
  );
}

export default wrapper.withRedux(
  appWithTranslation(NekoCapApp, nextI18NextConfig),
);
