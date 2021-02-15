import React, { ReactNode } from "react";
import {
  LoadSingleCaptionResult,
  SubmitCaptionRequest,
  CaptionContainer,
  CaptionListFields,
  VideoSource,
  RawCaptionData,
  VideoFields,
} from "../../feature/video/types";
import {
  BackendProvider,
  LoginMethod,
  LoginOptions,
  LoginResponse,
  LogoutOptions,
  UserData,
} from "../backend-provider";
import { RootState } from "../../store/types";
import { LoginStorage } from "../../feature/login/types";
import * as Parse from "parse";
import {
  ProviderType,
  ResponseStatus,
  ServerResponse,
  UploadResponse,
} from "../../types";
import {
  LoadPrivateCaptionerDataRequestParams,
  LoadPrivateCaptionerDataResponse,
  PrivateCaptionerData,
  RoleRequest,
  CaptionsRequest,
  CaptionsResponse,
  UpdateCaptionerProfileParams,
  VerifyRequest,
  BanRequest,
} from "../../feature/captioner/types";
import {
  LoadProfileParams,
  PublicProfileData,
} from "../../feature/profile/types";
import {
  LoadCaptionForReviewResult,
  ReasonedCaptionAction,
  ReviewActionDetails,
} from "../../feature/caption-review/types";
import { SearchRequest, VideoSearchResults } from "../../feature/search/types";
import * as firebase from "firebase/app";
import "firebase/auth";

import { convertBlobToBase64 } from "../../utils";
import type {
  LoadCaptionForReviewResponse,
  LoadSingleCaptionResponse,
  VideoSearchResponse,
  PublicProfileResponse,
  BrowseResponse,
} from "./types";
import { isFirefoxExtension } from "@/common/client-utils";
import {
  BrowseRequest,
  BrowseResults,
} from "@/common/feature/public-dashboard/types";

//#region
const loginWithGoogle = async (
  background: boolean
): Promise<{
  accessToken?: string;
  idToken?: string;
  status: ResponseStatus;
  userData?: UserData;
}> => {
  if (background) {
    return { status: "error" };
  }
  if (isFirefoxExtension()) {
    const nonce = Math.floor(Math.random() * 1000);
    const responseUrl = await browser.identity.launchWebAuthFlow({
      url: `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&nonce=${nonce}&scope=openid%20profile&client_id=${
        process.env.GOOGLE_OAUTH_CLIENT_ID
      }&redirect_uri=${browser.identity.getRedirectURL()}`,
      interactive: true,
    });
    // Parse the response url for the id token
    const idToken = responseUrl.split("id_token=")[1].split("&")[0];
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    await firebase.auth().signInWithCredential(credential);
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  }
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  user.displayName;
  if (!idToken) {
    return { status: "error" };
  }
  const userData: UserData = {
    id: user.uid,
    username: user.displayName,
    idToken,
  };
  userData.idToken = idToken;

  return { idToken, userData, status: "success" };
};

//#endregion

//#region Auth Providers
const googleProvider: Parse.AuthProvider = {
  authenticate() {
    /* no-content */
  },

  restoreAuthentication() {
    return true;
  },

  getAuthType() {
    return "google";
  },

  deauthenticate() {
    /* no-content */
  },
};

const firebaseProvider: Parse.AuthProvider = {
  authenticate() {
    /* no-content */
  },

  restoreAuthentication() {
    return true;
  },

  getAuthType() {
    return "firebase";
  },

  deauthenticate() {
    /* no-content */
  },
};

//#endregion

type ParseState = RootState;

export class ParseProvider implements BackendProvider<ParseState> {
  type() {
    return ProviderType.Parse;
  }

  constructor() {
    Parse.initialize(process.env.PARSE_APP_ID);
    // @ts-ignore
    Parse.serverURL =
      process.env.PARSE_SERVER_URL || "http://localhost:4041/parse";
    window.Parse = Parse;
  }

  getSelectors() {
    return {
      isLoggedInSelector: (state: ParseState) => {
        return state.login.loggedIn;
      },
      userSelector: (state: ParseState): UserData | undefined => {
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
    // TODO: Temporary measure, log the user out before logging in to bypass the invalid session token issue on parse
    await this.logout({
      logoutFromAuthServer: options ? !options.background : true,
    });
    const { background = false, userData: presetUserData } = options || {};
    let responseStatus: ResponseStatus;
    let userData: UserData = presetUserData;
    let authData: Parse.AuthData = {};
    if (!userData) {
      if (method === LoginMethod.Google) {
        window.skipAutoLogin = true;
        const loginResponse = await loginWithGoogle(background);
        responseStatus = loginResponse.status;
        userData = loginResponse.userData;
        authData = {
          id: userData.id,
          access_token: loginResponse.idToken,
        };
      }

      if (responseStatus === "error") {
        throw new Error("error");
      }
    } else {
      authData = {
        id: userData.id,
        access_token: userData.idToken,
      };
    }

    const storedData: { login: LoginStorage } | undefined = undefined;

    let loginOpts: Parse.FullOptions = undefined;
    if (storedData && storedData.login && storedData.login.sessionToken) {
      loginOpts = {
        sessionToken: storedData.login.sessionToken,
      };
    }
    let authProvider;
    switch (method) {
      case LoginMethod.Google:
      case LoginMethod.Firebase:
      default:
        authProvider = firebaseProvider;
    }
    let parseUser = await Parse.User.logInWith(
      authProvider,
      {
        authData,
      },
      loginOpts
    );
    userData.sessionToken = parseUser.getSessionToken();
    userData.isNewUser = !parseUser.existed();
    if (userData.isNewUser) {
      parseUser = await parseUser.save();
    }

    return { status: responseStatus, userData };
  }

  async logout(options?: LogoutOptions) {
    await Parse.User.logOut();
    if (!options || options.logoutFromAuthServer !== false) {
      await firebase.auth().signOut();
    }
  }

  async loadCaptions({
    videoId,
    videoSource,
  }: {
    videoId: string;
    videoSource: VideoSource;
  }) {
    return Parse.Cloud.run("findCaptions", { videoId, videoSource });
  }

  async loadUserCaptions(
    request: CaptionsRequest
  ): Promise<CaptionListFields[]> {
    const response = await Parse.Cloud.run<
      (params: CaptionsRequest) => CaptionsResponse
    >("loadUserCaptions", request);
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions } = response;
    return captions;
  }

  async loadPrivateCaptionerData({
    withCaptions = true,
  }: LoadPrivateCaptionerDataRequestParams): Promise<PrivateCaptionerData> {
    const response = await Parse.Cloud.run<
      (
        params: LoadPrivateCaptionerDataRequestParams
      ) => LoadPrivateCaptionerDataResponse
    >("loadPrivateCaptionerData", { withCaptions });
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, privateProfile, captioner } = response;
    return {
      captions,
      privateProfile,
      captioner,
    };
  }

  async loadProfile(options?: LoadProfileParams): Promise<PublicProfileData> {
    const response = await Parse.Cloud.run<
      (params: LoadProfileParams) => PublicProfileResponse
    >("loadProfile", options);
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, captioner } = response;
    return {
      captions,
      captioner,
    };
  }

  async updateCaptionerProfile(
    params: UpdateCaptionerProfileParams
  ): Promise<PrivateCaptionerData> {
    const response = await Parse.Cloud.run<
      (params: UpdateCaptionerProfileParams) => LoadPrivateCaptionerDataResponse
    >("updateCaptionerProfile", params);

    if (response.status !== "success") {
      throw new Error(response.error);
    }
    const { captions, privateProfile, captioner } = response;
    return {
      captions,
      privateProfile,
      captioner,
    };
  }

  async loadLatestCaptions(): Promise<CaptionsResponse> {
    const response = await Parse.Cloud.run<() => CaptionsResponse>(
      "loadLatestCaptions"
    );
    return response;
  }

  async loadLatestUserLanguageCaptions(
    languageCode: string
  ): Promise<CaptionsResponse> {
    return await Parse.Cloud.run<
      ({ languageCode: string }) => CaptionsResponse
    >("loadLatestLanguageCaptions", { languageCode });
  }

  async loadPopularCaptions(): Promise<CaptionsResponse> {
    return await Parse.Cloud.run<() => CaptionsResponse>("loadPopularCaptions");
  }

  async loadCaption({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadSingleCaptionResult> {
    const response = await Parse.Cloud.run<
      ({ captionId: string }) => LoadSingleCaptionResponse
    >("loadCaption", { captionId });
    if (response.status === "error") {
      throw new Error(response.error);
    }
    const {
      caption: serverCaption,
      userLike,
      userDislike,
      rawCaption: serverRawCaption,
      rawCaptionUrl,
      originalTitle,
      captionerName,
    } = response;
    const captionResponse = serverCaption as Parse.Object;
    const caption: CaptionContainer = {
      id: captionResponse.id,
      loadedByUser: false,
      videoId: captionResponse.get("videoId"),
      translatedTitle: captionResponse.get("translatedTitle") || "",
      originalTitle: originalTitle,
      videoSource: parseInt(captionResponse.get("videoSource")),
      data: JSON.parse(captionResponse.get("content")),
      creator: captionResponse.get("creatorId"),
      creatorName: captionerName,
      languageCode: captionResponse.get("language"),
      likes: captionResponse.get("likes") || 0,
      dislikes: captionResponse.get("dislikes") || 0,
      tags: captionResponse.get("tags") || [],
      userLike,
      userDislike,
    };
    // Load the raw caption if a url is supplied. The server cannot send the file directly
    // (refer to server code for reason)
    let rawCaption: string | undefined = undefined;
    if (rawCaptionUrl) {
      const rawCaptionResponse = await fetch(rawCaptionUrl);
      let rawCaptionString = await convertBlobToBase64(
        await rawCaptionResponse.blob()
      );
      rawCaptionString = rawCaptionString.split(",")[1];
      const rawType = (JSON.parse(serverRawCaption) as RawCaptionData).type;
      rawCaption = JSON.stringify({
        type: rawType,
        data: rawCaptionString,
      });
    }

    return { caption, userLike, userDislike, rawCaption };
  }

  async loadCaptionForReview({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadCaptionForReviewResult> {
    const response = await Parse.Cloud.run<
      ({ captionId: string }) => LoadCaptionForReviewResponse
    >("loadCaptionForReview", { captionId });
    const {
      status,
      caption: serverCaption,
      captioner,
      videoName,
      error,
    } = response;
    if (status !== "success") {
      throw new Error(`Failed to load caption: ${error}`);
    }
    const captionResponse = serverCaption as Parse.Object;
    const caption: CaptionContainer = {
      id: captionResponse.id,
      loadedByUser: false,
      videoId: captionResponse.get("videoId"),
      videoSource: parseInt(captionResponse.get("videoSource")),
      data: JSON.parse(captionResponse.get("content")),
      creator: captionResponse.get("creatorId"),
      languageCode: captionResponse.get("language"),
      likes: captionResponse.get("likes") || 0,
      dislikes: captionResponse.get("dislikes") || 0,
      tags: captionResponse.get("tags") || [],
      userLike: false,
      userDislike: false,
    };
    const rejected: boolean = captionResponse.get("rejected");
    const verified: boolean = captionResponse.get("verified");
    const reviewHistory: ReviewActionDetails[] = captionResponse.get(
      "reviewHistory"
    );
    return {
      caption,
      captioner,
      videoName,
      rejected,
      verified,
      reviewHistory,
    };
  }

  async likeCaption({ captionId }: { captionId: string }) {
    return Parse.Cloud.run("likeCaption", { captionId });
  }
  async dislikeCaption({ captionId }: { captionId: string }) {
    return Parse.Cloud.run("dislikeCaption", { captionId });
  }

  async submitCaption({
    caption,
    rawCaption,
    video,
    hasAudioDescription,
  }: SubmitCaptionRequest): Promise<UploadResponse> {
    const submitResult: ServerResponse = await Parse.Cloud.run<
      (p: SubmitCaptionRequest) => ServerResponse
    >("submitCaption", {
      caption,
      rawCaption,
      video,
      hasAudioDescription,
    });
    if (submitResult.status !== "success") {
      return {
        status: "error",
        error: submitResult.error || "",
      };
    }
    return { status: "success" };
  }

  async deleteCaption(captionId: string): Promise<ServerResponse> {
    const deleteResult: ServerResponse = await Parse.Cloud.run(
      "deleteCaption",
      { captionId }
    );
    return deleteResult;
  }

  async rejectCaption(params: ReasonedCaptionAction): Promise<ServerResponse> {
    const result: ServerResponse = await Parse.Cloud.run(
      "rejectCaption",
      params
    );
    return result;
  }

  async verifyCaption(params: ReasonedCaptionAction): Promise<ServerResponse> {
    const result: ServerResponse = await Parse.Cloud.run(
      "verifyCaption",
      params
    );
    return result;
  }

  async assignReviewerManager(params: RoleRequest): Promise<ServerResponse> {
    const result: ServerResponse = await Parse.Cloud.run(
      "assignReviewerManagerRole",
      params
    );
    return result;
  }

  async assignReviewer(params: RoleRequest): Promise<ServerResponse> {
    const result: ServerResponse = await Parse.Cloud.run(
      "assignReviewerRole",
      params
    );
    return result;
  }

  async verifyCaptioner(params: VerifyRequest): Promise<ServerResponse> {
    const result: ServerResponse = await Parse.Cloud.run(
      "verifyCaptioner",
      params
    );
    return result;
  }

  async banCaptioner(params: BanRequest): Promise<ServerResponse> {
    const result: ServerResponse = await Parse.Cloud.run(
      "banCaptioner",
      params
    );
    return result;
  }

  async search(params: SearchRequest): Promise<VideoSearchResults> {
    const response: VideoSearchResponse = await Parse.Cloud.run(
      "search",
      params
    );
    const results: VideoSearchResults = {
      status: response.status,
      hasMoreResults: response.hasMoreResults,
      error: response.error,
      videos: [],
    };
    if (response.videos) {
      results.videos = response.videos.map((video) => {
        return (video.toJSON() as unknown) as VideoFields;
      });
    }
    return results;
  }
  async browse(params: BrowseRequest): Promise<BrowseResults> {
    const response: BrowseResponse = await Parse.Cloud.run("browse", params);
    const results: BrowseResults = {
      status: response.status,
      hasMoreResults: response.hasMoreResults,
      error: response.error,
      captions: response.captions,
    };
    return results;
  }
}
