import { ParseProvider } from "@/common/providers/parse/parse-provider";
import type { GetServerSideProps, GetStaticProps } from "next";
import * as Parse from "parse/node";

export const NextWrapper = {
  getStaticProps: <P extends unknown = any>(
    callback: GetStaticProps<P>
  ): GetStaticProps<P> => {
    return async (context) => {
      global.backendProvider = new ParseProvider(
        Parse,
        process.env.NEXT_PUBLIC_PARSE_APP_ID,
        process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
        process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
      );
      return callback(context);
    };
  },
  getServerSideProps: <P extends unknown = any>(
    callback: GetServerSideProps<P>
  ): GetServerSideProps<P> => {
    return async (context) => {
      global.backendProvider = new ParseProvider(
        Parse,
        process.env.NEXT_PUBLIC_PARSE_APP_ID,
        process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
        process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
      );
      return callback(context);
    };
  },
};