import { CaptionsResponse } from "../../feature/captioner/types";
import { SearchRequest, VideoSearchResults } from "../../feature/search/types";
import { BackendProvider } from "../backend-provider";
import { RootState } from "../../store/types";

class NestJsProvider {
  constructor(private readonly backup: BackendProvider<RootState>) {}

  private getBaseUrl(): string | undefined {
    return process.env.NEXT_PUBLIC_NEKOCAP_API_URL;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const base = this.getBaseUrl();
    if (!base) {
      throw new Error("NEXT_PUBLIC_NEKOCAP_API_URL is not set");
    }
    const url = new URL(`${base}/api/v1${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private async get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NestJS request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async loadLatestCaptions(): Promise<CaptionsResponse> {
    try {
      return await this.get<CaptionsResponse>("/captions/latest");
    } catch (e) {
      return {
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        captions: [],
        hasMore: false,
      };
    }
  }

  async search(params: SearchRequest): Promise<VideoSearchResults> {
    try {
      const query: Record<string, string> = { title: params.title };
      if (params.videoLanguageCode) {
        query.videoLanguageCode = params.videoLanguageCode;
      }
      if (params.captionLanguageCode) {
        query.captionLanguageCode = params.captionLanguageCode;
      }
      if (params.limit != null) {
        query.limit = String(params.limit);
      }
      if (params.offset != null) {
        query.offset = String(params.offset);
      }
      return await this.get<VideoSearchResults>("/search", query);
    } catch (e) {
      return {
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        videos: [],
        hasMoreResults: false,
      };
    }
  }
}

export function createNestJsProvider(
  backup: BackendProvider<RootState>,
): BackendProvider<RootState> {
  const overrides = new NestJsProvider(backup);
  const overridesProto = Object.getPrototypeOf(overrides);
  return new Proxy(overrides, {
    get(target, prop, receiver) {
      if (
        prop in target ||
        Object.prototype.hasOwnProperty.call(overridesProto, prop)
      ) {
        return Reflect.get(target, prop, receiver);
      }
      const fallback = (backup as unknown as Record<string | symbol, unknown>)[
        prop
      ];
      if (typeof fallback === "function") {
        return (fallback as (...args: unknown[]) => unknown).bind(backup);
      }
      return fallback;
    },
  }) as unknown as BackendProvider<RootState>;
}
