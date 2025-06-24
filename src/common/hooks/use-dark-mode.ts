import { useEffect, useState } from "react";
import { isClient } from "../client-utils";
import { videoSourceToProcessorMap } from "../feature/video/utils";

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkModeValue);

  useEffect(() => {
    if (!isClient() || !window.matchMedia) return;
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
  return [isDarkMode, setIsDarkMode] as const;
}

export function getInitialDarkModeValue() {
  if (!isClient() || !window.matchMedia) return false;
  const siteSpecificDarkMode = isInSiteSpecificDarkMode();
  if (siteSpecificDarkMode !== "device-mode") {
    return siteSpecificDarkMode;
  }
  if (window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

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
