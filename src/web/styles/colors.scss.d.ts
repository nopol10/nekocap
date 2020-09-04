declare namespace ColorsScssNamespace {
  export interface IColorsScss {
    base: string;
    hello: string;
    white: string;
  }
}

declare const ColorsScssModule: ColorsScssNamespace.IColorsScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: ColorsScssNamespace.IColorsScss;
};

export = ColorsScssModule;
