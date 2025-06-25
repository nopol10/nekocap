import { ANTD_LOCALES } from "@/common/antd-locales";
import { ThemeProvider } from "@/common/contexts/theme-context";
import {
  getInitialDarkModeValue,
  useDarkMode,
} from "@/common/hooks/use-dark-mode";
import { ANTD_THEME_CONFIG } from "@/common/styles/antd-theme";
import { CustomEvents } from "@/common/types";
import { ConfigProvider, theme } from "antd";
import React, { useEffect, useMemo } from "react";

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  const contextValue = useMemo(() => {
    return {
      isDarkMode,
    };
  }, [isDarkMode]);

  /**
   * We need to know when we get fresh page meta so we can derive the current dark mode
   * from the correct processor.
   * E.g. when moving from netflix home page (no processor detected) -> netflix video page (processor detected)
   */
  useEffect(
    function registerPageMetaChangeListener() {
      function handlePageMetaRefreshed() {
        setIsDarkMode(getInitialDarkModeValue());
      }
      document.body.addEventListener(
        CustomEvents.PageMetaRefreshed,
        handlePageMetaRefreshed,
      );

      return () => {
        document.body.removeEventListener(
          CustomEvents.PageMetaRefreshed,
          handlePageMetaRefreshed,
        );
      };
    },
    [setIsDarkMode],
  );

  return (
    <ConfigProvider
      locale={ANTD_LOCALES["en-US"]}
      theme={{
        ...ANTD_THEME_CONFIG,
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <ThemeProvider value={contextValue}>{children}</ThemeProvider>
    </ConfigProvider>
  );
}
