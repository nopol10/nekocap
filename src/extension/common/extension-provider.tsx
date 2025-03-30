import { ANTD_LOCALES } from "@/common/antd-locales";
import { ANTD_THEME_CONFIG } from "@/common/styles/antd-theme";
import { ConfigProvider } from "antd";

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={ANTD_LOCALES["en-US"]} theme={ANTD_THEME_CONFIG}>
      {children}
    </ConfigProvider>
  );
}
