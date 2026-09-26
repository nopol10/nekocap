import type { GetAutoCaptionListParams } from "../../feature/caption-editor/types";
import type {
  GetAutoCaptionListResponse,
  GetAutoCaptionListResult,
} from "../../feature/caption-editor/types";
import type {
  LoadCaptionForReviewResult,
  ReasonedCaptionAction,
} from "../../feature/caption-review/types";
import type {
  BanRequest,
  CaptionsRequest,
  CaptionsResponse,
  LoadPrivateCaptionerDataRequestParams,
  LoadPrivateCaptionerDataResponse,
  PrivateCaptionerData,
  RoleRequest,
  UpdateCaptionerProfileParams,
  VerifyRequest,
} from "../../feature/captioner/types";
import type {
  DeleteProfileTagParams,
  DeleteProfileTagResponse,
  GetOwnProfileTagsResponse,
  LoadProfileParams,
  PublicProfileData,
} from "../../feature/profile/types";
import type {
  BrowseRequest,
  BrowseResults,
} from "../../feature/public-dashboard/types";
import type {
  SearchRequest,
  VideoSearchResults,
} from "../../feature/search/types";
import type { StatsResponse } from "../../feature/stats/types";
import type {
  LoadCaptionListResult,
  LoadCaptionsResult,
  LoadSingleCaptionResult,
  SubmitCaptionRequest,
  UpdateCaptionRequest,
  VideoSource,
} from "../../feature/video/types";
import { isServer } from "../../client-utils";
import type { RootState } from "../../store/types";
import type { ServerResponse, UploadResponse, UploadResult } from "../../types";
import { BackendProvider, LoginMethod, UserData } from "../backend-provider";
import {
  type ServerCaptionForReviewResponse,
  type ServerSingleCaptionResponse,
  toLoadCaptionForReviewResult,
  toLoadSingleCaptionResult,
} from "../caption-response";
import type { ParseProvider } from "../parse/parse-provider";
import type { BrowseResponse, PublicProfileResponse } from "../parse/types";

type QueryValue = string | number | boolean | string[] | undefined | null;

type RequestOptions = {
  query?: Record<string, QueryValue>;
  body?: unknown;
};

type LoginResponse = ServerResponse & {
  sessionToken?: string;
  userId?: string;
  isNewUser?: boolean;
};

/**
 * The identity provider on the server that verifies each login method
 */
const IDENTITY_PROVIDERS: Record<LoginMethod, string> = {
  [LoginMethod.Google]: "firebase",
  [LoginMethod.Firebase]: "firebase",
};

/**
 * Talks to the NekoCap (NestJS) REST API.
 *
 * Wraps a ParseProvider: login state (the current user and their session) is
 * still kept by the Parse SDK so that it survives restarts the same way it
 * always has and anything not implemented here falls back to Parse. Sessions
 * are shared between the NestJS API and Parse, so either can be used with the
 * same login.
 */
class NestJsProvider {
  constructor(private readonly backup: ParseProvider) {}

  private getBaseUrl(): string | undefined {
    if (isServer() && process.env.NEKOCAP_INTERNAL_API_URL) {
      return process.env.NEKOCAP_INTERNAL_API_URL;
    }
    return process.env.NEXT_PUBLIC_NEKOCAP_API_URL;
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const base = this.getBaseUrl();
    if (!base) {
      throw new Error("NEXT_PUBLIC_NEKOCAP_API_URL is not set");
    }
    const url = new URL(`${base}/api/v1${path}`);
    for (const [key, value] of Object.entries(query || {})) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    { query, body }: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {};
    const sessionToken = isServer()
      ? undefined
      : await this.backup.getSessionToken();
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(this.buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`NestJS request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  }

  private get<T>(path: string, query?: RequestOptions["query"]): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  private post<T>(path: string, body: unknown = {}): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  //#region Auth

  async completeDeferredLogin(
    method: LoginMethod,
    userData: UserData,
    authData: Record<string, string>,
  ): Promise<UserData> {
    const response = await this.post<LoginResponse>("/auth/login", {
      provider:
        IDENTITY_PROVIDERS[method] || IDENTITY_PROVIDERS[LoginMethod.Firebase],
      authData,
    });
    if (response.status !== "success" || !response.sessionToken) {
      throw new Error(response.error || "Login failed");
    }
    // Keep the Parse SDK's current user in sync so that login state persists
    // and anything still going through Parse uses the same session
    await this.backup.become(response.sessionToken);
    userData.sessionToken = response.sessionToken;
    userData.isNewUser = !!response.isNewUser;
    return userData;
  }

  //#endregion

  //#region Captions

  async loadCaptions({
    videoId,
    videoSource,
  }: {
    videoId: string;
    videoSource: VideoSource;
  }): Promise<LoadCaptionsResult[]> {
    return this.get<LoadCaptionsResult[]>("/captions", {
      videoId,
      videoSource,
    });
  }

  async loadCaption({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadSingleCaptionResult> {
    const response = await this.get<
      ServerResponse & ServerSingleCaptionResponse
    >(`/captions/${encodeURIComponent(captionId)}`);
    if (!response) {
      throw new Error(`[loadCaption] No response for captionId ${captionId}`);
    }
    if (response.status === "error") {
      throw new Error(
        `[loadCaption] Error for captionId ${captionId}:` + response.error,
      );
    }
    return toLoadSingleCaptionResult(response);
  }

  async loadCaptionForReview({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadCaptionForReviewResult> {
    const response = await this.get<
      ServerResponse & ServerCaptionForReviewResponse
    >(`/captions/${encodeURIComponent(captionId)}/review`);
    if (response.status !== "success") {
      throw new Error(`Failed to load caption: ${response.error}`);
    }
    return toLoadCaptionForReviewResult(response);
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

  async loadLatestUserLanguageCaptions(
    languageCode: string,
  ): Promise<CaptionsResponse> {
    return this.get<CaptionsResponse>(
      `/captions/latest/${encodeURIComponent(languageCode)}`,
    );
  }

  async loadPopularCaptions(): Promise<CaptionsResponse> {
    return this.get<CaptionsResponse>("/captions/popular");
  }

  async likeCaption({ captionId }: { captionId: string }) {
    return this.post<ServerResponse>(
      `/captions/${encodeURIComponent(captionId)}/like`,
    );
  }

  async dislikeCaption({ captionId }: { captionId: string }) {
    return this.post<ServerResponse>(
      `/captions/${encodeURIComponent(captionId)}/dislike`,
    );
  }

  async submitCaption({
    caption,
    rawCaption,
    video,
    hasAudioDescription,
    privacy,
  }: SubmitCaptionRequest): Promise<UploadResult> {
    const submitResult = await this.post<UploadResponse>("/captions", {
      caption,
      rawCaption,
      video,
      hasAudioDescription,
      privacy,
    });
    if (submitResult.status !== "success") {
      return { status: "error", error: submitResult.error || "" };
    }
    return { status: "success", captionId: submitResult.captionId };
  }

  async updateCaption({
    captionId,
    captionData,
    rawCaption,
    hasAudioDescription,
    translatedTitle,
    selectedTags,
    privacy,
  }: UpdateCaptionRequest): Promise<UploadResponse> {
    const updateResult = await this.request<ServerResponse>(
      "PATCH",
      `/captions/${encodeURIComponent(captionId)}`,
      {
        body: {
          captionData,
          rawCaption,
          hasAudioDescription,
          translatedTitle,
          selectedTags,
          privacy,
        },
      },
    );
    if (updateResult.status !== "success") {
      return { status: "error", error: updateResult.error || "" };
    }
    return { status: "success" };
  }

  async deleteCaption(captionId: string): Promise<ServerResponse> {
    return this.request<ServerResponse>(
      "DELETE",
      `/captions/${encodeURIComponent(captionId)}`,
    );
  }

  async rejectCaption({
    captionId,
    reason,
  }: ReasonedCaptionAction): Promise<ServerResponse> {
    return this.post<ServerResponse>(
      `/captions/${encodeURIComponent(captionId)}/reject`,
      { reason },
    );
  }

  async verifyCaption({
    captionId,
    reason,
  }: ReasonedCaptionAction): Promise<ServerResponse> {
    return this.post<ServerResponse>(
      `/captions/${encodeURIComponent(captionId)}/verify`,
      { reason },
    );
  }

  async browse(params: BrowseRequest): Promise<BrowseResults> {
    const response = await this.get<BrowseResponse>("/captions/browse", {
      limit: params.limit,
      offset: params.offset,
    });
    return {
      status: response.status,
      hasMoreResults: response.hasMoreResults,
      error: response.error,
      captions: response.captions,
      totalCount: response.totalCount,
    };
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

  //#endregion

  //#region Captioners

  async loadUserCaptions(
    request: CaptionsRequest,
  ): Promise<LoadCaptionListResult> {
    const { captionerId, tags, limit, offset, advancedFilter, titleFilter } =
      request;
    const response = await this.get<CaptionsResponse>(
      `/captioners/${encodeURIComponent(captionerId)}/captions`,
      { tags, limit, offset, advancedFilter, titleFilter },
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, hasMore } = response;
    return { captions, hasMore };
  }

  async loadPrivateCaptionerData({
    withCaptions = true,
  }: LoadPrivateCaptionerDataRequestParams): Promise<PrivateCaptionerData> {
    const response = await this.get<LoadPrivateCaptionerDataResponse>(
      "/captioners/me",
      { withCaptions },
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, privateProfile, captioner } = response;
    return { captions, privateProfile, captioner };
  }

  async loadProfile({
    profileId,
    withCaptions = true,
  }: LoadProfileParams): Promise<PublicProfileData> {
    const response = await this.get<PublicProfileResponse>(
      `/captioners/${encodeURIComponent(profileId)}`,
      { withCaptions },
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, captioner } = response;
    return { captions, captioner };
  }

  async updateCaptionerProfile(
    params: UpdateCaptionerProfileParams,
  ): Promise<PrivateCaptionerData> {
    const response = await this.request<LoadPrivateCaptionerDataResponse>(
      "PATCH",
      "/captioners/me",
      { body: params },
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, privateProfile, captioner } = response;
    return { captions, privateProfile, captioner };
  }

  async assignReviewerManager({
    targetUserId,
  }: RoleRequest): Promise<ServerResponse> {
    return this.post<ServerResponse>(
      `/captioners/${encodeURIComponent(targetUserId)}/roles/reviewer-manager`,
    );
  }

  async assignReviewer({ targetUserId }: RoleRequest): Promise<ServerResponse> {
    return this.post<ServerResponse>(
      `/captioners/${encodeURIComponent(targetUserId)}/roles/reviewer`,
    );
  }

  async verifyCaptioner({
    targetUserId,
  }: VerifyRequest): Promise<ServerResponse> {
    return this.post<ServerResponse>(
      `/captioners/${encodeURIComponent(targetUserId)}/verify`,
    );
  }

  async banCaptioner({ targetUserId }: BanRequest): Promise<ServerResponse> {
    return this.post<ServerResponse>(
      `/captioners/${encodeURIComponent(targetUserId)}/ban`,
    );
  }

  async getOwnProfileTags(): Promise<GetOwnProfileTagsResponse> {
    const response = await this.get<GetOwnProfileTagsResponse>(
      "/captioners/me/tags",
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    return response;
  }

  async deleteProfileTag({
    tagName,
  }: DeleteProfileTagParams): Promise<DeleteProfileTagResponse> {
    const response = await this.request<DeleteProfileTagResponse>(
      "DELETE",
      `/captioners/me/tags/${encodeURIComponent(tagName)}`,
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    return response;
  }

  //#endregion

  //#region Others

  async getAutoCaptionList(
    params: GetAutoCaptionListParams,
  ): Promise<GetAutoCaptionListResult> {
    const response = await this.get<GetAutoCaptionListResponse>(
      "/videos/auto-captions",
      { videoId: params.videoId, videoSource: params.videoSource },
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    return response;
  }

  async getGlobalStats(): Promise<StatsResponse> {
    const response = await this.get<StatsResponse>("/stats/global");
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    return response;
  }

  //#endregion
}

/**
 * Creates a provider that uses the NekoCap (NestJS) API, falling back to the
 * given Parse provider for everything the NestJS provider doesn't implement.
 */
export function createNestJsProvider(
  backup: ParseProvider,
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
        // Bound to the proxy so that fallback methods calling other provider
        // methods (e.g. Parse's login calling completeDeferredLogin) use the
        // NestJS implementations of those methods
        return (fallback as (...args: unknown[]) => unknown).bind(receiver);
      }
      return fallback;
    },
  }) as unknown as BackendProvider<RootState>;
}
