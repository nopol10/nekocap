import { ANTD_LOCALES } from "@/common/antd-locales";
import { ThemeProvider } from "@/common/contexts/theme-context";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { ANTD_THEME_CONFIG } from "@/common/styles/antd-theme";
import { CustomEvents } from "@/common/types";
import { ConfigProvider, theme } from "antd";
import React, { useEffect, useMemo, useState } from "react";

function isInSiteSpecificDarkMode(): boolean | "device-mode" {
  const processor = videoSourceToProcessorMap[globalThis.videoSource];
  if (processor?.darkModeSelector) {
    if (document.querySelector(processor.darkModeSelector)) {
      return true;
    }
    return false;
  }
  return "device-mode";
}

function getInitialDarkModeValue() {
  const siteSpecificDarkMode = isInSiteSpecificDarkMode();
  if (siteSpecificDarkMode !== "device-mode") {
    return siteSpecificDarkMode;
  }
  if (window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkModeValue);

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
  useEffect(function registerPageMetaChangeListener() {
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
  }, []);

  useEffect(() => {
    if (!window.matchMedia) return;
    const siteSpecificDarkMode = isInSiteSpecificDarkMode();
    if (siteSpecificDarkMode !== "device-mode") {
      // No need to listen for device changes if the site has its own dark mode
      return;
    }

    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    // Set up listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    // Modern browsers
    darkModeMediaQuery.addEventListener("change", handleChange);

    // Cleanup listener on component unmount
    return () => {
      darkModeMediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

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
