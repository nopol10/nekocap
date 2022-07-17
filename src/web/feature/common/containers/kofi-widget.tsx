import { colors } from "@/common/colors";
import { waitUntil } from "@/common/utils";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import React, { ReactElement, useEffect } from "react";
import { createGlobalStyle } from "styled-components";

const KofiCSSOverride = createGlobalStyle`
  div[id^="kofi-widget-overlay-"] {
    .floatingchat-container-wrap, .floatingchat-container-wrap-mobi {
      right: 16px;
      left: unset;
    }
    .floating-chat-kofi-popup-iframe, .floating-chat-kofi-popup-iframe-mobi {
      right: 16px;
      left: unset;
    }
    .floatingchat-container-mobi {
      right: 0;
      left: unset;
      width: 176px;
    }
  }
`;
export const KofiWidget = (): ReactElement => {
  const { t } = useTranslation("common");
  useEffect(() => {
    (async () => {
      await waitUntil(() => typeof window["kofiWidgetOverlay"] !== undefined);
      window.kofiWidgetOverlay?.draw("nopol10", {
        type: "floating-chat",
        "floating-chat.donateButton.text": t("common.kofiSupportMe"),
        "floating-chat.donateButton.background-color": colors.base,
        "floating-chat.donateButton.text-color": "#fff",
        "floating-chat.core.position.bottom-left":
          "position: fixed; bottom: 50px; right: 10px; width: 160px; height: 65px;",
      });
    })();
  }, []);
  return (
    <>
      <Head>
        <script
          defer
          src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
        ></script>
      </Head>
      <KofiCSSOverride />
    </>
  );
};
