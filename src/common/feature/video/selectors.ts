import { isInBackgroundScript } from "@/common/client-utils";
import { RootState } from "@/common/store/types";
import { CaptionRendererType } from "./types";
// Caption Editor relies on Video feature, but not the other way round. Don't import caption-editor files here

export const fontListSelector = () => (state: RootState) => {
  return state.video.fontList;
};

export const loadedCaptionSelector = (tabId: number) => (state: RootState) => {
  const tabData = state.video.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.video.tabData[tabId].caption;
};

export const tabVideoDataSelector = (tabId: number) => (state: RootState) => {
  const tabData = state.video.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.video.tabData[tabId];
};

export const availableRenderersSelector = (tabId: number) => (
  state: RootState
): CaptionRendererType[] => {
  const videoTabData = state.video.tabData;
  const editorTabData = state.captionEditor.tabData;
  const background = isInBackgroundScript();
  const editorTabRawData =
    background &&
    globalThis.backgroundEditorRawCaption &&
    globalThis.backgroundEditorRawCaption[tabId]
      ? globalThis.backgroundEditorRawCaption[tabId]
      : globalThis.editorRawCaption; //state.captionEditor.tabRawData;
  if (!videoTabData && !editorTabData && !editorTabRawData) {
    return [];
  }
  const captionInUse =
    editorTabData && editorTabData[tabId]
      ? editorTabData[tabId].present.caption
      : videoTabData[tabId]?.caption;
  const rawCaptionInUse = editorTabRawData
    ? editorTabRawData
    : background &&
      globalThis.backgroundRawCaption &&
      globalThis.backgroundRawCaption[tabId]
    ? globalThis.backgroundRawCaption[tabId]
    : globalThis.rawCaption;
  const isValidCaption = captionInUse && captionInUse.data?.tracks?.length > 0;
  if (!isValidCaption && !rawCaptionInUse) {
    return [];
  }

  const renderers: CaptionRendererType[] = [];
  if (!rawCaptionInUse) {
    renderers.push(CaptionRendererType.Default);
  } else if (!isValidCaption) {
    if (rawCaptionInUse.type === "ass" || rawCaptionInUse.type === "ssa") {
      renderers.push(CaptionRendererType.AdvancedOctopus);
    }
  } else {
    renderers.push(CaptionRendererType.Default);
    if (rawCaptionInUse.type === "ass" || rawCaptionInUse.type === "ssa") {
      renderers.push(CaptionRendererType.AdvancedOctopus);
    }
  }

  return renderers;
};

export const showEditorIfPossibleSelector = (tabId: number) => (
  state: RootState
) => {
  const tabData = state.video.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.video.tabData[tabId].showEditorIfPossible;
};
