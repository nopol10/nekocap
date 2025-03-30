import { stringifyCaption } from "@/common/caption-parsers";
import { CaptionFileFormat } from "@/common/types";
import { CaptionContainer, RawCaptionData } from "../video/types";
import { saveCaptionToDisk } from "./saver";

export function exportCaption({
  caption,
  rawCaption,
}: {
  caption: CaptionContainer;
  rawCaption: RawCaptionData | null;
}) {
  if (!caption) {
    throw Error("No caption found data found");
  }
  const captionFormat = rawCaption ? rawCaption.type : CaptionFileFormat.srt;
  let captionString = "";
  if (rawCaption) {
    captionString = rawCaption.data;
  } else {
    captionString = stringifyCaption(captionFormat, caption.data);
  }
  const filename = `${caption.videoId}.${CaptionFileFormat[captionFormat]}`;
  saveCaptionToDisk({
    captionString,
    filename,
  });
}
