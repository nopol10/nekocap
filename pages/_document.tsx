import Document, { Html, Head, Main, NextScript } from "next/document";
import React, { ReactNode } from "react";
import { ServerStyleSheet } from "styled-components";
import { createHash } from "crypto";

const getCSP = (props) => {
  let csp = "";
  csp += `base-uri 'self';`;
  csp += `form-action 'self';`;
  csp += `default-src 'self' https://vitals.vercel-insights.com;`;
  csp += `img-src * data:;`;
  csp += `font-src 'self' data: https://fonts.gstatic.com;`;
  if (process.env.NODE_ENV !== "production") {
    csp += `style-src 'self' https://fonts.googleapis.com 'unsafe-inline' data:; script-src 'unsafe-eval' 'self' ${cspHashOf(
      NextScript.getInlineScriptSource(props)
    )}`;
  } else {
    csp += `default-src 'self';`;
    csp += `script-src 'self' ${cspHashOf(
      NextScript.getInlineScriptSource(props)
    )};`;
    // TODO: remove unsafe inline and find a better way
    csp += `style-src 'self' https://fonts.googleapis.com 'unsafe-inline' data:;`;
  }

  return csp;
};

const cspHashOf = (text) => {
  const hash = createHash("sha256");
  hash.update(text);
  return `'sha256-${hash.digest("base64")}'`;
};
export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <meta
            httpEquiv="Content-Security-Policy"
            content={getCSP(this.props)}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
