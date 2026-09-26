import { isServer } from "../client-utils";
import type {
  LoadCaptionForReviewResult,
  ReviewActionDetails,
} from "../feature/caption-review/types";
import type { CaptionerFields } from "../feature/captioner/types";
import type {
  CaptionContainer,
  LoadSingleCaptionResult,
  RawCaptionData,
} from "../feature/video/types";
import { convertBlobToBase64 } from "../utils";

/**
 * A caption as sent by the server: a Parse object when loaded through the
 * Parse API, or the JSON form of that Parse object when loaded through the
 * NekoCap (NestJS) API
 */
export type ServerCaption =
  | { id?: string; get: (key: string) => any }
  | ({ objectId: string } & Record<string, any>);

const readCaption = (
  caption: ServerCaption,
): { id: string; get: (key: string) => any } => {
  if (typeof caption.get === "function") {
    const parseObject = caption as { id?: string; get: (key: string) => any };
    return {
      id: parseObject.id || "",
      get: (key) => parseObject.get(key),
    };
  }
  const json = caption as { objectId: string } & Record<string, any>;
  return { id: json.objectId, get: (key) => json[key] };
};

export type ServerSingleCaptionResponse = {
  caption: ServerCaption;
  rawCaption?: string;
  rawCaptionUrl?: string;
  userLike?: boolean;
  userDislike?: boolean;
  originalTitle?: string;
  captionerName?: string;
};

export type ServerCaptionForReviewResponse = {
  caption: ServerCaption;
  captioner: CaptionerFields;
  videoName: string;
};

/**
 * Loads the raw caption from the url supplied by the server. The server cannot
 * send the file directly (refer to server code for reason)
 */
const loadRawCaption = async (
  originalRawCaptionUrl: string,
  serverRawCaption?: string,
): Promise<string> => {
  let rawCaptionUrl = originalRawCaptionUrl;
  let rawCaptionString = "";
  if (isServer()) {
    if (process.env.NEXT_PUBLIC_PARSE_SERVER_URL) {
      rawCaptionUrl = rawCaptionUrl.replace(
        process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
        process.env.PARSE_INTERNAL_SERVER_URL || "",
      );
    }
    const rawCaptionResponse = await fetch(rawCaptionUrl);
    const arrayBuffer = await rawCaptionResponse.arrayBuffer();
    rawCaptionString = Buffer.from(arrayBuffer).toString("base64");
  } else {
    const rawCaptionResponse = await fetch(rawCaptionUrl);
    rawCaptionString = await convertBlobToBase64(
      await rawCaptionResponse.blob(),
    );
    rawCaptionString = rawCaptionString.split(",")[1];
  }
  if (!serverRawCaption) {
    throw new Error("No raw caption data found");
  }
  const rawType = (JSON.parse(serverRawCaption) as RawCaptionData).type;
  return JSON.stringify({
    type: rawType,
    data: rawCaptionString,
  });
};

export const toLoadSingleCaptionResult = async (
  response: ServerSingleCaptionResponse,
): Promise<LoadSingleCaptionResult> => {
  const {
    caption: serverCaption,
    userLike,
    userDislike,
    rawCaption: serverRawCaption,
    rawCaptionUrl: originalRawCaptionUrl,
    originalTitle,
    captionerName,
  } = response;
  const captionResponse = readCaption(serverCaption);
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
  const rawCaption = originalRawCaptionUrl
    ? await loadRawCaption(originalRawCaptionUrl, serverRawCaption)
    : null;
  return { caption, userLike, userDislike, rawCaption };
};

export const toLoadCaptionForReviewResult = (
  response: ServerCaptionForReviewResponse,
): LoadCaptionForReviewResult => {
  const { caption: serverCaption, captioner, videoName } = response;
  const captionResponse = readCaption(serverCaption);
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
  const reviewHistory: ReviewActionDetails[] =
    captionResponse.get("reviewHistory");
  return {
    caption,
    captioner,
    videoName,
    rejected,
    verified,
    reviewHistory,
  };
};
