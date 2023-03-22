import React, { useEffect } from "react";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { wrapper } from "@/web/store/store";

import "antd/dist/antd.less";
import "antd/lib/layout/style";
import "antd/lib/table/style";
import "antd/lib/modal/style";
import "antd/lib/message/style";
import "antd/lib/dropdown/style";
import "antd/lib/popover/style";
import "antd/lib/popconfirm/style";
import "antd/lib/upload/style";
import "antd/lib/tag/style";

import "../src/web/feature/home/home.scss";
import "../src/web/styles/index.scss";
import nextI18NextConfig from "../next-i18next.config.js";
import { ConfigProvider } from "antd";
import { useRouter } from "next/router";
import { ANTD_LOCALES } from "@/common/antd-locales";
import { useDayjsLocale } from "@/common/hooks/use-dayjs-locale";

function NekoCapApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useDayjsLocale(router.locale);
  return (
    <>
      <ConfigProvider
        locale={
          ANTD_LOCALES[router?.locale || "en-US"] || ANTD_LOCALES["en-US"]
        }
      >
        <Component {...pageProps} />
      </ConfigProvider>
    </>
  );
}

export default wrapper.withRedux(
  // @ts-ignore
  appWithTranslation(NekoCapApp, nextI18NextConfig)
);
