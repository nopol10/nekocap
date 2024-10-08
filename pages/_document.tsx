import Document, { Html, Head, Main, NextScript } from "next/document";
import React from "react";
import { ServerStyleSheet } from "styled-components";
import { createHash } from "crypto";

const getCSP = (props) => {
  let csp = "";
  csp += `base-uri 'self';`;
  csp += `form-action 'self';`;
  csp += `default-src 'self';`;
  csp += `img-src 'self' https://*.ko-fi.com https://*.youtube.com https://*.vimeocdn.com https://*.vimeo.com https://i.ytimg.com https://*.dmcdn.net https://*.tenor.com data:;`;
  csp += `font-src 'self' https://nekocap.com https://*.nekocap.com data: https://fonts.gstatic.com;`;

  const dailymotionDomains =
    "https://*.dailymotion.com https://*.dmcdn.net https://*.dm-event.net";
  const commonConnectSrc = `https://www.googleapis.com https://*.google.com/ https://securetoken.googleapis.com/ https://identitytoolkit.googleapis.com/ https://*.noembed.com/ https://*.sentry.io/ https://vimeo.com/ ${dailymotionDomains}`;
  const commonScriptSrc = `https://*.google.com/ https://*.ko-fi.com https://*.vimeo.com ${dailymotionDomains}`;
  const commonStyleSrc = "https://*.ko-fi.com";
  const commonFrameSrc = `https://nekocap.com https://nekocap-42.firebaseapp.com https://ko-fi.com/ https://*.vimeo.com/ ${dailymotionDomains}`;
  const isViewer = props.url?.startsWith("/view/");

  if (process.env.NODE_ENV !== "production") {
    csp += `style-src 'self' https://fonts.googleapis.com ${commonStyleSrc} 'unsafe-inline' data:;`;
    csp += `script-src 'unsafe-eval' 'self' http://www.youtube.com/ ${commonScriptSrc} ${cspHashOf(
      NextScript.getInlineScriptSource(props),
    )};`;
    csp += `connect-src 'self' http://localhost:* https://nekocap.com:* https://*.nekocap.com:* ${commonConnectSrc};`;
    csp += `frame-src 'self' http://www.youtube.com/ https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN} ${commonFrameSrc};`;
  } else {
    csp += `script-src 'self'${
      isViewer ? " 'wasm-unsafe-eval'" : ""
    } https://www.youtube.com/ ${commonScriptSrc} ${cspHashOf(
      NextScript.getInlineScriptSource(props),
    )};`;
    csp += `connect-src 'self' https://nekocap.com:* https://*.nekocap.com:* ${commonConnectSrc};`;
    csp += `frame-src 'self' https://www.youtube.com/ ${commonFrameSrc};`;
    // TODO: remove unsafe inline and find a better way
    csp += `style-src 'self' https://fonts.googleapis.com ${commonStyleSrc} 'unsafe-inline' data:;`;
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
    const url = ctx.req.url;
    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        url,
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
          <meta
            name="keywords"
            content="free,open source,community captions,chrome extension,firefox extension,browser extension,extension,youtube,niconico,vimeo,bilibili,tbs free,tver,video,subtitle,subtitles,caption,captions,caption uploader,subtitles uploader,upload,editor,import,export,srt,sbv,vtt,ass,substation alpha,ssa,advanced substation alpha,advanced subtitles,aegisub,subtitleedit,amara"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Bungee+Inline&family=Rambla:ital,wght@0,400;0,700;1,400;1,700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body dir="auto">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
