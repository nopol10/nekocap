import { createReducer } from "@reduxjs/toolkit";
import {
  clearTabData,
  dislikeCaption,
  likeCaption,
  loadCaptions,
  setContentPageType,
  setLoadedCaption,
  setRenderer,
  setServerCaptions,
  setShowCaption,
  unsetTabData,
} from "@/common/feature/video/actions";
import {
  CaptionRendererType,
  PageType,
  TabVideoData,
  VideoState,
} from "@/common/feature/video/types";

const defaultTabVideoData: TabVideoData = {
  showEditorIfPossible: true,
  showCaption: true,
  renderer: CaptionRendererType.Default,
  pageType: PageType.SearchResults,
};

export const videoReducer = createReducer<VideoState>(
  { tabData: {} },
  (builder) => {
    loadCaptions.augmentReducer(builder);
    likeCaption.augmentReducer(builder);
    dislikeCaption.augmentReducer(builder);
    return builder
      .addCase(setLoadedCaption, (state, action) => {
        const { payload } = action;
        const { caption, rawCaption, tabId } = payload;
        const currentTab: TabVideoData =
          state.tabData[tabId] || defaultTabVideoData;
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              caption,
              rawCaption,
              showCaption: true,
            },
          },
        };
      })
      .addCase(setShowCaption, (state, action) => {
        const { payload } = action;
        const { show, tabId } = payload;
        const currentTab: TabVideoData =
          { ...state.tabData[tabId] } || defaultTabVideoData;
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              showCaption: show,
            },
          },
        };
      })
      .addCase(setServerCaptions, (state, action) => {
        const { payload } = action;
        const { captions, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              serverCaptionList: captions,
            },
          },
        };
      })
      .addCase(setRenderer, (state, action) => {
        const { payload } = action;
        const { renderer, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              renderer,
            },
          },
        };
      })
      .addCase(setContentPageType, (state, action) => {
        const { payload } = action;
        const { pageType, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              pageType,
            },
          },
        };
      })
      .addCase(clearTabData, (state, action) => {
        const { payload } = action;
        const { tabId } = payload;
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              showCaption: true,
              showEditorIfPossible: true,
              renderer: CaptionRendererType.Default,
              pageType: PageType.SearchResults,
            },
          },
        };
      })
      .addCase(unsetTabData, (state, action) => {
        const { payload } = action;
        const { tabId } = payload;
        const newTabData = { ...state.tabData };
        // @ts-ignore
        const newTabMeta = { ...state.tabMeta };
        delete newTabData[tabId];
        delete newTabMeta[tabId];
        return {
          ...state,
          tabData: newTabData,
          tabMeta: newTabMeta,
        };
      });
  }
);
