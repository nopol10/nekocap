import React, { ReactNode } from "react";
import {
  LoadSingleCaptionResult,
  SubmitCaptionRequest,
  CaptionContainer,
  CaptionListFields,
  VideoSource,
  RawCaptionData,
  VideoFields,
  UpdateCaptionRequest,
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
import type * as ParseTypeImport from "parse";
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
import nodefetch from "node-fetch";

import { convertBlobToBase64 } from "../../utils";
import type {
  LoadCaptionForReviewResponse,
  LoadSingleCaptionResponse,
  VideoSearchResponse,
  PublicProfileResponse,
  BrowseResponse,
} from "./types";
import {
  isClient,
  isFirefoxExtension,
  isInExtension,
  isInServiceWorker,
  isServer,
} from "@/common/client-utils";
import {
  BrowseRequest,
  BrowseResults,
} from "@/common/feature/public-dashboard/types";
import {
  GetAutoCaptionListParams,
  GetAutoCaptionListResponse,
  GetAutoCaptionListResult,
} from "@/common/feature/caption-editor/types";
import { initXMLHttpRequestShim } from "@/libs/xmlhttprequest-shim";
import { ChromeStorageController } from "./chrome-storage-controller";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { routeNames } from "@/web/feature/route-types";

//#region
const loginWithGoogle = async (
  background: boolean,
  oauthClientId = ""
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
      url: `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&nonce=${nonce}&scope=openid%20profile&client_id=${oauthClientId}&redirect_uri=${browser.identity.getRedirectURL()}`,
      interactive: true,
    });
    // Parse the response url for the id token
    const idToken = responseUrl.split("id_token=")[1].split("&")[0];
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(globalThis.firebaseAuth, credential);
  } else if (isInExtension()) {
    // Redirect user to NekoCap's login webpage
    const loginUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL + routeNames.extensionSignIn.slice(1);
    if (isInServiceWorker()) {
      chrome.tabs.create({ url: loginUrl });
    } else {
      window.open(loginUrl, "_blank");
    }
    return { status: "deferred" };
  } else {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(globalThis.firebaseAuth, provider);
  }
  const user: FirebaseUser = globalThis.firebaseAuth.currentUser;
  const idToken = await user.getIdToken();
  if (!idToken) {
    return { status: "error" };
  }
  const userData: UserData = {
    id: user.uid,
    username: user.displayName,
    idToken,
  };

  return { idToken, userData, status: "success" };
};

//#endregion

//#region Auth Providers
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

type ParseType = typeof ParseTypeImport;

export class ParseProvider implements BackendProvider<ParseState> {
  private Parse: ParseType = null;
  private googleOauthClientId = "";

  type() {
    return ProviderType.Parse;
  }

  constructor(
    newParse: ParseType,
    parseAppId: string = process.env.NEXT_PUBLIC_PARSE_APP_ID,
    parseUrl: string = process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
    googleOauthClientId: string = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
  ) {
    this.Parse = newParse;
    this.googleOauthClientId = googleOauthClientId;
    this.Parse.initialize(parseAppId);
    // @ts-ignore
    this.Parse.serverURL = parseUrl || "http://localhost:4041/parse";
    if (isClient()) {
      globalThis.Parse = this.Parse;
    }
    if (isInExtension()) {
      // @ts-ignore
      this.Parse.CoreManager.setStorageController(ChromeStorageController());
    }
    // @ts-ignore
    const controller = this.Parse.CoreManager.getRESTController();
    if (!isServer()) {
      initXMLHttpRequestShim();
      controller._setXHR(XMLHttpRequest);
    }
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
    const { background = false, userData: presetUserData } = options || {};
    const currentUser = await this.Parse.User.currentAsync();
    // Check if a user exists and has a valid session token
    if (currentUser && options?.userData) {
      const dummyQuery = new this.Parse.Query("captions").limit(0);
      try {
        await dummyQuery.find();
        // The user exists, no need to do anything
        presetUserData.sessionToken = currentUser.getSessionToken();
        presetUserData.isNewUser = !currentUser.existed();
        return { status: "success", userData: presetUserData };
      } catch (e) {
        console.warn("Encountered error when making dummy query:", e);
      }
      await this.logout({
        logoutFromAuthServer: options ? !options.background : true,
      });
    }
    let responseStatus: ResponseStatus;
    let userData: UserData = presetUserData;
    let authData: ParseTypeImport.AuthData = {};
    if (!userData) {
      if (method === LoginMethod.Google) {
        if (isClient()) {
          globalThis.skipAutoLogin = true;
        }
        const loginResponse = await loginWithGoogle(
          background,
          this.googleOauthClientId
        );
        if (loginResponse.status === "deferred") {
          return { status: "deferred" };
        }
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
    userData = await this.completeDeferredLogin(method, userData, authData);

    return { status: responseStatus, userData };
  }

  async completeDeferredLogin(
    method: LoginMethod,
    userData: UserData,
    authData: ParseTypeImport.AuthData
  ): Promise<UserData> {
    const loginOpts: ParseTypeImport.FullOptions = undefined;
    let authProvider;
    switch (method) {
      case LoginMethod.Google:
      case LoginMethod.Firebase:
      default:
        authProvider = firebaseProvider;
    }
    let parseUser = await this.Parse.User.logInWith(
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
    return userData;
  }

  async logout(options?: LogoutOptions) {
    await this.Parse.User.logOut();
    if (!options || options.logoutFromAuthServer !== false) {
      await signOut(globalThis.firebaseAuth);
    }
  }

  async loadCaptions({
    videoId,
    videoSource,
  }: {
    videoId: string;
    videoSource: VideoSource;
  }) {
    return this.Parse.Cloud.run("findCaptions", { videoId, videoSource });
  }

  async loadUserCaptions(
    request: CaptionsRequest
  ): Promise<CaptionListFields[]> {
    const response = await this.Parse.Cloud.run<
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
    const response = await this.Parse.Cloud.run<
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
    const response = await this.Parse.Cloud.run<
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
    const response = await this.Parse.Cloud.run<
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
    const response = await this.Parse.Cloud.run<() => CaptionsResponse>(
      "loadLatestCaptions"
    );
    return response;
  }

  async loadLatestUserLanguageCaptions(
    languageCode: string
  ): Promise<CaptionsResponse> {
    return await this.Parse.Cloud.run<
      ({ languageCode: string }) => CaptionsResponse
    >("loadLatestLanguageCaptions", { languageCode });
  }

  async loadPopularCaptions(): Promise<CaptionsResponse> {
    return await this.Parse.Cloud.run<() => CaptionsResponse>(
      "loadPopularCaptions"
    );
  }

  async loadCaption({
    captionId,
  }: {
    captionId: string;
  }): Promise<LoadSingleCaptionResult> {
    const response = await this.Parse.Cloud.run<
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
      rawCaptionUrl: originalRawCaptionUrl,
      originalTitle,
      captionerName,
    } = response;
    const captionResponse = serverCaption as ParseTypeImport.Object;
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
      userLike: userLike !== undefined ? userLike : null,
      userDislike: userDislike !== undefined ? userDislike : null,
    };
    // Load the raw caption if a url is supplied. The server cannot send the file directly
    // (refer to server code for reason)
    let rawCaption: string | null = null;
    if (originalRawCaptionUrl) {
      let rawCaptionUrl = originalRawCaptionUrl;
      let rawCaptionString = "";
      if (isServer()) {
        rawCaptionUrl = rawCaptionUrl.replace(
          process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
          process.env.PARSE_INTERNAL_SERVER_URL
        );
        rawCaptionString = await nodefetch(rawCaptionUrl)
          .then((response) => response.buffer())
          .then((buffer) => {
            return buffer.toString("base64");
          });
      } else {
        const rawCaptionResponse = await fetch(rawCaptionUrl);
        rawCaptionString = await convertBlobToBase64(
          await rawCaptionResponse.blob()
        );
        rawCaptionString = rawCaptionString.split(",")[1];
      }

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
    const response = await this.Parse.Cloud.run<
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
    const captionResponse = serverCaption as ParseTypeImport.Object;
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
    return this.Parse.Cloud.run("likeCaption", { captionId });
  }
  async dislikeCaption({ captionId }: { captionId: string }) {
    return this.Parse.Cloud.run("dislikeCaption", { captionId });
  }

  async submitCaption({
    caption,
    rawCaption,
    video,
    hasAudioDescription,
  }: SubmitCaptionRequest): Promise<UploadResponse> {
    const submitResult: ServerResponse = await this.Parse.Cloud.run<
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

  async updateCaption({
    captionId,
    captionData,
    rawCaption,
    hasAudioDescription,
    translatedTitle,
  }: UpdateCaptionRequest): Promise<UploadResponse> {
    const updateResult: ServerResponse = await this.Parse.Cloud.run<
      (p: UpdateCaptionRequest) => ServerResponse
    >("updateCaption", {
      captionId,
      captionData,
      rawCaption,
      hasAudioDescription,
      translatedTitle,
    });
    if (updateResult.status !== "success") {
      return {
        status: "error",
        error: updateResult.error || "",
      };
    }
    return { status: "success" };
  }

  async deleteCaption(captionId: string): Promise<ServerResponse> {
    const deleteResult: ServerResponse = await this.Parse.Cloud.run(
      "deleteCaption",
      { captionId }
    );
    return deleteResult;
  }

  async rejectCaption(params: ReasonedCaptionAction): Promise<ServerResponse> {
    const result: ServerResponse = await this.Parse.Cloud.run(
      "rejectCaption",
      params
    );
    return result;
  }

  async verifyCaption(params: ReasonedCaptionAction): Promise<ServerResponse> {
    const result: ServerResponse = await this.Parse.Cloud.run(
      "verifyCaption",
      params
    );
    return result;
  }

  async assignReviewerManager(params: RoleRequest): Promise<ServerResponse> {
    const result: ServerResponse = await this.Parse.Cloud.run(
      "assignReviewerManagerRole",
      params
    );
    return result;
  }

  async assignReviewer(params: RoleRequest): Promise<ServerResponse> {
    const result: ServerResponse = await this.Parse.Cloud.run(
      "assignReviewerRole",
      params
    );
    return result;
  }

  async verifyCaptioner(params: VerifyRequest): Promise<ServerResponse> {
    const result: ServerResponse = await this.Parse.Cloud.run(
      "verifyCaptioner",
      params
    );
    return result;
  }

  async banCaptioner(params: BanRequest): Promise<ServerResponse> {
    const result: ServerResponse = await this.Parse.Cloud.run(
      "banCaptioner",
      params
    );
    return result;
  }

  async search(params: SearchRequest): Promise<VideoSearchResults> {
    const response: VideoSearchResponse = await this.Parse.Cloud.run(
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
    const response: BrowseResponse = await this.Parse.Cloud.run(
      "browse",
      params
    );
    const results: BrowseResults = {
      status: response.status,
      hasMoreResults: response.hasMoreResults,
      error: response.error,
      captions: response.captions,
    };
    return results;
  }
  async getAutoCaptionList(
    params: GetAutoCaptionListParams
  ): Promise<GetAutoCaptionListResult> {
    const response: GetAutoCaptionListResponse = await this.Parse.Cloud.run(
      "getAutoCaptionList",
      params
    );
    if (response.status !== "success") {
      throw new Error(response.error);
    }
    return response;
  }
}
