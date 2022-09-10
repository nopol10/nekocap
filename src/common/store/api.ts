import {
  BaseQueryFn,
  createApi,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { Locator } from "@/common/locator/locator";
import { BackendProvider } from "../providers/backend-provider";
import { RootState } from "./types";
import {
  EndpointBuilder,
  QueryDefinition,
} from "@reduxjs/toolkit/dist/query/endpointDefinitions";

type ProviderType = {
  [F in keyof BackendProvider<RootState>]: BackendProvider<
    RootState
  >[F] extends (...args: any[]) => any
    ? {
        P: Parameters<BackendProvider<RootState>[F]>;
        R: Awaited<ReturnType<BackendProvider<RootState>[F]>>;
      }
    : never;
};

type QueryType<T extends keyof ProviderType> = {
  [K in keyof ProviderType]: [func: K, ...args: ProviderType[T]["P"]];
}[T];

type BackendBaseQuery<F extends keyof ProviderType> = BaseQueryFn<
  QueryType<F>,
  ProviderType[F]["R"],
  FetchBaseQueryError,
  any,
  FetchBaseQueryMeta
>;

export const providerBaseQuery = ({
  provider,
}: {
  provider: BackendProvider<RootState>;
}): BackendBaseQuery<keyof BackendProvider<RootState>> => async (
  [func, ...args],
  { signal, dispatch, getState },
  extraOptions
) => {
  try {
    // @ts-ignore
    const result = await provider[func](...args);
    return {
      data: result,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
};

export const nekocapQueryMaker = <
  FuncName extends keyof ProviderType,
  TagType extends string,
  ReducerPath extends string,
  B extends EndpointBuilder<
    BackendBaseQuery<keyof BackendProvider<RootState>>,
    TagType,
    ReducerPath
  >
>(
  builder: B,
  functionName: FuncName,
  queryOptions?: Partial<
    QueryDefinition<
      ProviderType[FuncName]["P"],
      BackendBaseQuery<keyof BackendProvider<RootState>>,
      TagType,
      ProviderType[FuncName]["R"],
      ReducerPath
    >
  >
) => {
  return builder.query<
    ProviderType[FuncName]["R"],
    ProviderType[FuncName]["P"]
  >({
    ...queryOptions,
    // @ts-ignore TODO: figure out later
    query: (props) => {
      return [functionName, ...props];
    },
  });
};

export const nekocapApi = createApi({
  reducerPath: "nekocapApi",
  baseQuery: providerBaseQuery({ provider: Locator.provider() }),
  endpoints: (builder) => ({}),
});
