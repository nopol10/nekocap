import React, { ReactNode } from "react";
import {
  LoadSingleCaptionResult,
  SubmitCaptionRequest,
  CaptionListFields,
  VideoSource,
  UpdateCaptionRequest,
} from "../feature/video/types";
import {
  BackendProvider,
  LoginMethod,
  LoginOptions,
  LoginResponse,
  LogoutOptions,
  UserData,
} from "./backend-provider";
import { RootState } from "../store/types";
import {
  ChromeMessageType,
  ProviderType,
  ServerResponse,
  UploadResponse,
} from "../types";
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
import { LoadProfileParams, PublicProfileData } from "../feature/profile/types";
import {
  LoadCaptionForReviewResult,
  ReasonedCaptionAction,
} from "../feature/caption-review/types";
import { SearchRequest, VideoSearchResults } from "../feature/search/types";

import {
  BrowseRequest,
  BrowseResults,
} from "@/common/feature/public-dashboard/types";
import {
  GetAutoCaptionListParams,
  GetAutoCaptionListResult,
} from "@/common/feature/caption-editor/types";

export enum BackendProviderRequestTypes {
  Login,
  CompleteDeferredLogin,
  Logout,
  LoadCaptions,
  LoadUserCaptions,
  LoadPrivateCaptioner,
  LoadProfile,
  UpdateCaptionerProfile,
  LoadLatestCaptions,
  LoadLatestUserLanguageCaptions,
  LoadPopularCaptions,
  LoadCaption,
  LoadCaptionForReview,
  LikeCaption,
  DislikeCaption,
  SubmitCaption,
  UpdateCaption,
  DeleteCaption,
  RejectCaption,
  VerifyCaption,
  AssignReviewerManager,
  AssignReviewer,
  VerifyCaptioner,
  BanCaptioner,
  Search,
  Browse,
  GetAutoCaptionList,
}

export type BackendProviderRequest =
  | {
      type: BackendProviderRequestTypes.Login;
      method: LoginMethod;
      options?: LoginOptions;
    }
  | {
      type: BackendProviderRequestTypes.CompleteDeferredLogin;
      options: {
        method: LoginMethod;
        userData: UserData;
        authData: Record<string, string>;
      };
    }
  | {
      type: BackendProviderRequestTypes.Logout;
      options?: LogoutOptions;
    }
  | {
      type: BackendProviderRequestTypes.LoadCaptions;
      videoId: string;
      videoSource: VideoSource;
    }
  | {
      type: BackendProviderRequestTypes.LoadUserCaptions;
      request: CaptionsRequest;
    }
  | {
      type: BackendProviderRequestTypes.LoadPrivateCaptioner;
      withCaptions: boolean;
    }
  | {
      type: BackendProviderRequestTypes.LoadProfile;
      options?: LoadProfileParams;
    }
  | {
      type: BackendProviderRequestTypes.UpdateCaptionerProfile;
      params: UpdateCaptionerProfileParams;
    }
  | {
      type: BackendProviderRequestTypes.LoadLatestCaptions;
    }
  | {
      type: BackendProviderRequestTypes.LoadLatestUserLanguageCaptions;
      languageCode: string;
    }
  | {
      type: BackendProviderRequestTypes.LoadPopularCaptions;
    }
  | {
      type:
        | BackendProviderRequestTypes.LoadCaption
        | BackendProviderRequestTypes.LoadCaptionForReview
        | BackendProviderRequestTypes.LikeCaption
        | BackendProviderRequestTypes.DislikeCaption
        | BackendProviderRequestTypes.DeleteCaption;
      captionId: string;
    }
  | {
      type: BackendProviderRequestTypes.SubmitCaption;
      request: SubmitCaptionRequest;
    }
  | {
      type: BackendProviderRequestTypes.UpdateCaption;
      request: UpdateCaptionRequest;
    }
  | {
      type:
        | BackendProviderRequestTypes.RejectCaption
        | BackendProviderRequestTypes.VerifyCaption;
      params: ReasonedCaptionAction;
    }
  | {
      type:
        | BackendProviderRequestTypes.AssignReviewerManager
        | BackendProviderRequestTypes.AssignReviewer;
      params: RoleRequest;
    }
  | {
      type: BackendProviderRequestTypes.VerifyCaptioner;
      params: VerifyRequest;
    }
  | {
      type: BackendProviderRequestTypes.BanCaptioner;
      params: BanRequest;
    }
  | {
      type: BackendProviderRequestTypes.Search;
      params: SearchRequest;
    }
  | {
      type: BackendProviderRequestTypes.Browse;
      params: BrowseRequest;
    }
  | {
      type: BackendProviderRequestTypes.GetAutoCaptionList;
      params: GetAutoCaptionListParams;
    };

function sendBackgroundProviderRequest(
  request: BackendProviderRequest
): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: ChromeMessageType.ProviderRequest, payload: request },
      (response) => {
        resolve(response);
      }
    );
  });
}

export class PassthroughProvider implements BackendProvider<RootState> {
  type() {
    return ProviderType.Parse;
  }

  getSelectors() {
    return {
      isLoggedInSelector: (state: RootState) => {
        return state.login.loggedIn;
      },
      userSelector: (state: RootState): UserData | undefined => {
        if (!state.login.userData) {
          return undefined;
        }
        return state.login.userData;
      },
    };
  }

  getReducers() {
    return {};
  }

  getMiddlewares() {
    return [];
  }

  getWrapperProps() {
    return {};
  }

  wrapper({
    children,
    providerProps,
  }: {
    children: ReactNode;
    providerProps: any;
  }) {
    return <>{children}</>;
  }

  async login(
    method: LoginMethod,
    options?: LoginOptions
  ): Promise<LoginResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.Login,
      method,
      options,
    });
  }
  async completeDeferredLogin(
    method: LoginMethod,
    userData: UserData,
    authData: Record<string, string>
  ): Promise<UserData> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.CompleteDeferredLogin,
      options: { method, userData, authData },
    });
  }

  async logout(options?: LogoutOptions) {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.Logout,
      options,
    });
  }

  async loadCaptions({
    videoId,
    videoSource,
  }: {
    videoId: string;
    videoSource: VideoSource;
  }) {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadCaptions,
      videoId,
      videoSource,
    });
  }

  async loadUserCaptions(
    request: CaptionsRequest
  ): Promise<CaptionListFields[]> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadUserCaptions,
      request,
    });
  }

  async loadPrivateCaptionerData({
    withCaptions = true,
  }: LoadPrivateCaptionerDataRequestParams): Promise<PrivateCaptionerData> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadPrivateCaptioner,
      withCaptions,
    });
  }

  async loadProfile(options?: LoadProfileParams): Promise<PublicProfileData> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadProfile,
      options,
    });
  }

  async updateCaptionerProfile(
    params: UpdateCaptionerProfileParams
  ): Promise<PrivateCaptionerData> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.UpdateCaptionerProfile,
      params,
    });
  }

  async loadLatestCaptions(): Promise<CaptionsResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadLatestCaptions,
    });
  }

  async loadLatestUserLanguageCaptions(
    languageCode: string
  ): Promise<CaptionsResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadLatestUserLanguageCaptions,
      languageCode,
    });
  }

  async loadPopularCaptions(): Promise<CaptionsResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadPopularCaptions,
    });
  }

  async loadCaption({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadSingleCaptionResult> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadCaption,
      captionId,
    });
  }

  async loadCaptionForReview({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadCaptionForReviewResult> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LoadCaptionForReview,
      captionId,
    });
  }

  async likeCaption({ captionId }: { captionId: string }) {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.LikeCaption,
      captionId,
    });
  }

  async dislikeCaption({ captionId }: { captionId: string }) {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.DislikeCaption,
      captionId,
    });
  }

  async submitCaption(request: SubmitCaptionRequest): Promise<UploadResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.SubmitCaption,
      request,
    });
  }

  async updateCaption(request: UpdateCaptionRequest): Promise<UploadResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.UpdateCaption,
      request,
    });
  }

  async deleteCaption(captionId: string): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.DeleteCaption,
      captionId,
    });
  }

  async rejectCaption(params: ReasonedCaptionAction): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.RejectCaption,
      params,
    });
  }

  async verifyCaption(params: ReasonedCaptionAction): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.VerifyCaption,
      params,
    });
  }

  async assignReviewerManager(params: RoleRequest): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.AssignReviewerManager,
      params,
    });
  }

  async assignReviewer(params: RoleRequest): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.AssignReviewer,
      params,
    });
  }

  async verifyCaptioner(params: VerifyRequest): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.VerifyCaptioner,
      params,
    });
  }

  async banCaptioner(params: BanRequest): Promise<ServerResponse> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.BanCaptioner,
      params,
    });
  }

  async search(params: SearchRequest): Promise<VideoSearchResults> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.Search,
      params,
    });
  }

  async browse(params: BrowseRequest): Promise<BrowseResults> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.Browse,
      params,
    });
  }
  async getAutoCaptionList(
    params: GetAutoCaptionListParams
  ): Promise<GetAutoCaptionListResult> {
    return sendBackgroundProviderRequest({
      type: BackendProviderRequestTypes.GetAutoCaptionList,
      params,
    });
  }
}
