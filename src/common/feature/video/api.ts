import { getNekoCapWebsiteUrl, isInExtension } from "@/common/client-utils";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";

export const loadFontListApi = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(getNekoCapWebsiteUrl() + "fontlist.json");
    let data: Record<string, string> = await response.json();
    data = Object.keys(data).reduce((acc, key) => {
      acc[key] =
        (isInExtension() ? process.env.NEXT_PUBLIC_WEBSITE_URL : "").replace(
          /\/+$/,
          ""
        ) + data[key];
      return acc;
    }, {});
    return data;
  } catch (e) {
    return SUBSTATION_FONT_LIST;
  }
};
