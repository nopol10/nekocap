import { ParseProvider } from "@/common/providers/parse/parse-provider";
import { GetStaticProps, GetStaticPropsResult } from "next";
import { GetStaticPropsCallback } from "next-redux-wrapper";
import * as Parse from "parse/node";

type NextWrapperType = {
  getStaticProps: (
    originalGetStaticProps: GetStaticProps<any, any>
  ) => GetStaticProps<any, any>; //<P>(originalGetStaticProps: () => GetStaticPropsResult<P>) => (() => GetStaticPropsResult<P>);
};

export const NextWrapper = {
  getStaticProps: <P extends unknown = any>(
    callback: GetStaticProps<P>
  ): GetStaticProps<P> => {
    return async (context) => {
      global.backendProvider = new ParseProvider(Parse);
      return callback(context);
    };
  },
};
