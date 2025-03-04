import { ThemeConfig } from "antd";
import { colors } from "../colors";

export const ANTD_THEME_CONFIG: ThemeConfig = {
  token: {
    colorPrimary: colors.base,
    colorLink: colors.base,
    colorBorder: "rgb(193 193 193 / 39%)",
    fontFamily: '"Reddit Sans", sans-serif',
  },
  components: {
    Layout: {
      bodyBg: "#f0f2f5",
    },
  },
};
