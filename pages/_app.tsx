import React from "react";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { wrapper } from "@/web/store/store";

import "antd/dist/antd.less";
import "antd/lib/table/style";

import "../src/web/feature/home/home.scss";
import "../src/web/styles/index.scss";

function NekoCapApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
}

export default wrapper.withRedux(appWithTranslation(NekoCapApp));
