import { ParseProvider } from "@/common/providers/parse/parse-provider";
import type { GetServerSideProps, GetStaticProps } from "next";
import * as Parse from "parse/node";

const parseProvider = new ParseProvider(
  Parse,
  process.env.NEXT_PUBLIC_PARSE_APP_ID,
  process.env.PARSE_INTERNAL_SERVER_URL,
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
);

export const NextWrapper = {
  getStaticProps: <P extends { [key: string]: any } = any>(
    callback: GetStaticProps<P>,
  ): GetStaticProps<P> => {
    return async (context) => {
      global.backendProvider = parseProvider;
      return callback(context);
    };
  },
  getServerSideProps: <P extends { [key: string]: any } = any>(
    callback: GetServerSideProps<P>,
  ): GetServerSideProps<P> => {
    return async (context) => {
      global.backendProvider = parseProvider;
      return callback(context);
    };
  },
};
