export const SIZES = {
  mobileSmall: 320,
  mobileMedium: 375,
  mobileLarge: 425,
  tablet: 768,
  desktop: 1024,
};

export const DEVICE = {
  mobileSmall: `(min-width: ${SIZES.mobileSmall}px)`,
  mobileMedium: `(min-width: ${SIZES.mobileMedium}px)`,
  mobileLarge: `(min-width: ${SIZES.mobileLarge}px)`,
  tablet: `(min-width: ${SIZES.tablet}px)`,
  mobileOnly: `(max-width: ${SIZES.mobileLarge}px)`,
  desktop: `(min-width: ${SIZES.desktop}px)`,
};
