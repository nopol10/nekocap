import { Middleware, ReducersMapObject, Store } from "redux";
import {
  DeleteProfileTagParams,
  DeleteProfileTagResponse,
  GetOwnProfileTagsResponse,
  LoadProfileParams,
  PublicProfileData,
} from "../feature/profile/types";
import { SearchRequest, VideoSearchResults } from "../feature/search/types";
import {
  LoadCaptionForReviewResult,
  ReasonedCaptionAction,
} from "../feature/caption-review/types";
import {
  LoadPrivateCaptionerDataRequestParams,
  PrivateCaptionerData,
  RoleRequest,
  CaptionsRequest,
  CaptionsResponse,
  UpdateCaptionerProfileParams,
  VerifyRequest,
  BanRequest,
} from "../feature/captioner/types";
import {
  LoadSingleCaptionResult,
  SubmitCaptionRequest,
  VideoSource,
  UpdateCaptionRequest,
  LoadCaptionListResult,
} from "../feature/video/types";
import { RootState } from "../store/types";
import { ProviderType, ServerResponse, UploadResponse } from "../types";
import {
  BrowseRequest,
  BrowseResults,
} from "../feature/public-dashboard/types";
import {
  GetAutoCaptionListParams,
  GetAutoCaptionListResult,
} from "../feature/caption-editor/types";
import { StatsResponse } from "../feature/stats/types";

export enum LoginMethod {
  Google,
  Firebase,
}

export type LoginResponse = ServerResponse & {
  userData?: UserData;
};

type ProviderElementProps = {
  providerProps: any;
};

export type UserData = {
  id: string;
  username: string;
  email?: string;
  accessToken?: string;
  idToken?: string;
  sessionToken?: string;
  loginMethod?: LoginMethod;
  isNewUser?: boolean;
};

type AuthSelectors<T> = {
  isLoggedInSelector: (state: T) => boolean;
  userSelector: (state: T) => UserData | undefined;
};

export type LoginOptions = {
  background?: boolean;
  userData?: UserData;
};

export type LogoutOptions = {
  // Defaults to true, set to false if the backend is different from the auth server
  // and we only want to logout from the backend
  logoutFromAuthServer?: boolean;
};

export interface BackendProvider<T extends RootState> {
  type: () => ProviderType;
  getWrapperProps: (store: Store) => any;
  getReducers: () => ReducersMapObject;
  getMiddlewares: () => Middleware[];
  login: (
    method: LoginMethod,
    options?: LoginOptions
  ) => Promise<LoginResponse>;
  completeDeferredLogin: (
    method: LoginMethod,
    userData: UserData,
    authData: Record<string, string>
  ) => Promise<UserData>;
  logout: (options?: LogoutOptions) => Promise<void>;
  // Load the list of captions for a video without the contents
  loadCaptions: (props: {
    videoId: string;
    videoSource: VideoSource;
  }) => Promise<void>;
  loadCaption: (props: {
    captionId: string;
  }) => Promise<LoadSingleCaptionResult>;
  loadCaptionForReview: (props: {
    captionId: string;
  }) => Promise<LoadCaptionForReviewResult>;
  likeCaption: (props: { captionId: string }) => Promise<void>;
  dislikeCaption: (props: { captionId: string }) => Promise<void>;
  loadUserCaptions: (
    options?: CaptionsRequest
  ) => Promise<LoadCaptionListResult>;
  loadPrivateCaptionerData: (
    options?: LoadPrivateCaptionerDataRequestParams
  ) => Promise<PrivateCaptionerData>;
  loadProfile: (options: LoadProfileParams) => Promise<PublicProfileData>;
  updateCaptionerProfile: (
    options?: UpdateCaptionerProfileParams
  ) => Promise<PrivateCaptionerData>;
  submitCaption: (request: SubmitCaptionRequest) => Promise<UploadResponse>;
  updateCaption: (request: UpdateCaptionRequest) => Promise<UploadResponse>;
  deleteCaption: (captionId: string) => Promise<ServerResponse>;
  loadLatestCaptions: () => Promise<CaptionsResponse>;
  loadLatestUserLanguageCaptions: (
    languageCode: string
  ) => Promise<CaptionsResponse>;
  loadPopularCaptions: () => Promise<CaptionsResponse>;
  rejectCaption: (params: ReasonedCaptionAction) => Promise<ServerResponse>;
  verifyCaption: (params: ReasonedCaptionAction) => Promise<ServerResponse>;
  assignReviewerManager: (params: RoleRequest) => Promise<ServerResponse>;
  assignReviewer: (params: RoleRequest) => Promise<ServerResponse>;
  verifyCaptioner: (params: VerifyRequest) => Promise<ServerResponse>;
  banCaptioner: (params: BanRequest) => Promise<ServerResponse>;
  search: (params: SearchRequest) => Promise<VideoSearchResults>;
  browse: (params: BrowseRequest) => Promise<BrowseResults>;
  getSelectors: () => AuthSelectors<T>;
  getAutoCaptionList: (
    params: GetAutoCaptionListParams
  ) => Promise<GetAutoCaptionListResult>;
  getGlobalStats: () => Promise<StatsResponse>;
  getOwnProfileTags: () => Promise<GetOwnProfileTagsResponse>;
  deleteProfileTag: (
    params: DeleteProfileTagParams
  ) => Promise<DeleteProfileTagResponse>;
}
