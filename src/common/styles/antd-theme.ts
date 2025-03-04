import { ThemeConfig } from "antd";
import { colors } from "../colors";

export const ANTD_THEME_CONFIG: ThemeConfig = {
  token: {
    colorPrimary: colors.base,
    colorLink: colors.base,
    colorBorder: "rgb(193 193 193 / 39%)",
    fontFamily: '"Baloo 2", sans-serif',
  },
  components: {
    Layout: {
      bodyBg: "#f0f2f5",
    },
  },
};
