export const SUBSTATION_GROUPED_FONTS = {
  latin: {
    anton: "/fonts/Anton-Regular.woff2",
    "cabin condensed": "/fonts/Cabin-Condensed-Regular.woff2",
    "liberation sans": "/fonts/LiberationSans-Regular.woff2",
    "liberation sans bold": "/fonts/LiberationSans-Bold.woff2",
    poppins: "/fonts/Poppins-Regular.woff2",
    "poppins light": "/fonts/Poppins-300.woff2",
    "poppins bold": "/fonts/Poppins-700.woff2",
    "press start 2p": "/fonts/Press-Start-2P-Regular.woff2",
    roboto: "/fonts/Roboto-Regular.woff2",
    "roboto light": "/fonts/Roboto-300.woff2",
    "roboto bold": "/fonts/Roboto-700.woff2",
    "shadows into light": "/fonts/Shadows-Into-Light-Regular.woff2",
    "sigmar one": "/fonts/Sigmar-One-Regular.woff2",
    "source sans pro": "/fonts/Source-Sans-Pro-Regular.woff2",
    "source sans pro light": "/fonts/Source-Sans-Pro-300.woff2",
    "source sans pro semibold": "/fonts/Source-Sans-Pro-600.woff2",
    "source sans pro bold": "/fonts/Source-Sans-Pro-700.woff2",
    tinos: "/fonts/Tinos-Regular.woff2",
    "tinos bold": "/fonts/Tinos-700.woff2",
    arial: "/fonts/LiberationSans-Regular.woff2", // Arial is not free
    "arial bold": "/fonts/LiberationSans-Bold.woff2",
    "times new roman": "/fonts/Tinos-Regular.woff2", // Using Tinos as a Times New Roman replacement as TNR is not free
    "times new roman bold": "/fonts/Tinos-700.woff2",
  },
  japanese: {
    "kosugi maru": "/fonts/Kosugi-Maru-Regular.woff2",
    "noto sans jp": "/fonts/Noto-Sans-JP-Regular.woff2",
    "noto sans jp bold": "/fonts/Noto-Sans-JP-700.woff2",
  },
  simplifiedChinese: {
    "ma shan zheng": "/fonts/Ma-Shan-Zheng-Regular.woff2",
    "noto sans sc": "/fonts/Noto-Sans-SC-Regular.woff2",
    "noto sans sc bold": "/fonts/Noto-Sans-SC-700.woff2",
  },
  traditionalChinese: {
    "noto sans tc": "/fonts/Noto-Sans-TC-Regular.woff2",
    "noto sans tc bold": "/fonts/Noto-Sans-TC-700.woff2",
  },
  korean: {
    "noto sans kr": "/fonts/Noto-Sans-KR-Regular.woff2",
    "noto sans kr bold": "/fonts/Noto-Sans-KR-700.woff2",
    gaegu: "/fonts/Gaegu-Regular.woff2",
    "gaegu bold": "/fonts/Gaegu-700.woff2",
  },
  arabic: {
    cairo: "/fonts/Cairo-Regular.woff2",
    "cairo light": "/fonts/Cairo-300.woff2",
    "cairo semibold": "/fonts/Cairo-600.woff2",
    "cairo bold": "/fonts/Cairo-700.woff2",
    lateef: "/fonts/Lateef-Regular.woff2",
  },
  thai: {
    kanit: "/fonts/Kanit-Regular.woff2",
    "kanit light": "/fonts/Kanit-300.woff2",
    "kanit semibold": "/fonts/Kanit-600.woff2",
    "kanit bold": "/fonts/Kanit-700.woff2",
  },
  vietnamese: {
    anton: "/fonts/Anton-Regular.woff2",
    kanit: "/fonts/Kanit-Regular.woff2",
    "kanit light": "/fonts/Kanit-300.woff2",
    "kanit semibold": "/fonts/Kanit-600.woff2",
    "kanit bold": "/fonts/Kanit-700.woff2",
    roboto: "/fonts/Roboto-Regular.woff2",
    "roboto light": "/fonts/Roboto-300.woff2",
    "roboto bold": "/fonts/Roboto-700.woff2",
    "sigmar one": "/fonts/Sigmar-One-Regular.woff2",
    "source sans pro": "/fonts/Source-Sans-Pro-Regular.woff2",
    "source sans pro light": "/fonts/Source-Sans-Pro-300.woff2",
    "source sans pro semibold": "/fonts/Source-Sans-Pro-600.woff2",
    "source sans pro bold": "/fonts/Source-Sans-Pro-700.woff2",
  },
  devanagari: {
    poppins: "/fonts/Poppins-Regular.woff2",
    "poppins light": "/fonts/Poppins-300.woff2",
    "poppins bold": "/fonts/Poppins-700.woff2",
  },
  gujarati: {
    "hind vadodara": "/fonts/Hind-Vadodara-Regular.woff2",
    "hind vadodara light": "/fonts/Hind-Vadodara-300.woff2",
    "hind vadodara bold": "/fonts/Hind-Vadodara-700.woff2",
  },
  cyrillic: {
    "press start 2p": "/fonts/Press-Start-2P-Regular.woff2",
    roboto: "/fonts/Roboto-Regular.woff2",
    "roboto light": "/fonts/Roboto-300.woff2",
    "roboto bold": "/fonts/Roboto-700.woff2",
    "source sans pro": "/fonts/Source-Sans-Pro-Regular.woff2",
    "source sans pro light": "/fonts/Source-Sans-Pro-300.woff2",
    "source sans pro semibold": "/fonts/Source-Sans-Pro-600.woff2",
    "source sans pro bold": "/fonts/Source-Sans-Pro-700.woff2",
  },
  greek: {
    "press start 2p": "/fonts/Press-Start-2P-Regular.woff2",
    roboto: "/fonts/Roboto-Regular.woff2",
    "roboto light": "/fonts/Roboto-300.woff2",
    "roboto bold": "/fonts/Roboto-700.woff2",
    "source sans pro": "/fonts/Source-Sans-Pro-Regular.woff2",
    "source sans pro light": "/fonts/Source-Sans-Pro-300.woff2",
    "source sans pro semibold": "/fonts/Source-Sans-Pro-600.woff2",
    "source sans pro bold": "/fonts/Source-Sans-Pro-700.woff2",
  },
};

/**
 * Fonts excluded from being listed as they are not the actual ones used for rendering.
 * This is only used when displaying the font list to users
 */
export const EXCLUDED_FONTS = [
  "arial",
  "arial bold",
  "times new roman",
  "times new roman bold",
];

const flattenAndProcessFontList = (
  fontsObject: Record<string, Record<string, string> | string>,
  output: Record<string, string> = {}
) => {
  for (const key in fontsObject) {
    const fontObject = fontsObject[key];
    if (typeof fontObject === "object") {
      flattenAndProcessFontList(fontObject, output);
    } else if (typeof fontObject === "string") {
      output[key] = process.env.WEBSITE_URL.replace(/\/+$/, "") + fontObject;
    }
  }
  return output;
};
export const SUBSTATION_FONT_LIST = flattenAndProcessFontList(
  SUBSTATION_GROUPED_FONTS
);
