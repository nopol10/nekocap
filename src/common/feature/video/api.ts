import { getNekoCapWebsiteUrl, isInExtension } from "@/common/client-utils";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";

export const loadFontListApi = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(getNekoCapWebsiteUrl() + "fontlist.json");
    let data: Record<string, string> = await response.json();
    data = Object.keys(data).reduce((acc, key) => {
      const fontPath = data[key];
      if (fontPath.startsWith("/")) {
        acc[key] =
          process.env.NEXT_PUBLIC_FONTS_URL.replace(/\/+$/, "") + fontPath;
      } else {
        acc[key] = fontPath;
      }

      return acc;
    }, {});
    return data;
  } catch (e) {
    return SUBSTATION_FONT_LIST;
  }
};
