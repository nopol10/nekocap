import { createReducer } from "@reduxjs/toolkit";
import {
  clearTabData,
  dislikeCaption,
  likeCaption,
  loadCaptions,
  loadWebsiteViewerCaption,
  setContentPageType,
  setFontList,
  setIsLoadingRawCaption,
  setLoadedCaption,
  setMenuHidden,
  setRenderer,
  setServerCaptions,
  setShowCaption,
  setVideoDimensions,
  unsetTabData,
} from "@/common/feature/video/actions";
import {
  CaptionRendererType,
  PageType,
  TabVideoData,
  VideoState,
} from "@/common/feature/video/types";
import { hydrate } from "@/web/store/action";
import { isInBackgroundScript } from "@/common/client-utils";

const defaultTabVideoData: TabVideoData = {
  showEditorIfPossible: true,
  showCaption: true,
  renderer: CaptionRendererType.Default,
  pageType: PageType.SearchResults,
  menuHidden: false,
  isLoadingRawCaption: false,
};

export const videoReducer = createReducer<VideoState>(
  { fontList: {}, tabData: {} },
  (builder) => {
    loadCaptions.augmentReducer(builder);
    loadWebsiteViewerCaption.augmentReducer(builder);
    likeCaption.augmentReducer(builder);
    dislikeCaption.augmentReducer(builder);
    return builder
      .addCase(setLoadedCaption, (state, action) => {
        const { payload } = action;
        const { caption, tabId } = payload;
        const currentTab: TabVideoData =
          state.tabData[tabId] || defaultTabVideoData;
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              caption,
              showCaption: true,
            },
          },
        };
      })
      .addCase(setFontList, (state, action) => {
        const { payload } = action;
        const { list } = payload;
        return {
          ...state,
          fontList: list,
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
      .addCase(setVideoDimensions, (state, action) => {
        const { payload } = action;
        const { dimensions, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              videoDimensions: dimensions,
            },
          },
        };
      })
      .addCase(setContentPageType, (state, action) => {
        const { payload } = action;
        const { currentUrl, pageType, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              currentUrl,
              pageType,
            },
          },
        };
      })
      .addCase(setMenuHidden, (state, action) => {
        const { payload } = action;
        const { hidden, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              menuHidden: hidden,
            },
          },
        };
      })
      .addCase(clearTabData, (state, action) => {
        const { payload } = action;
        const { tabId } = payload;
        if (
          isInBackgroundScript() &&
          globalThis.backgroundRawCaption &&
          !!globalThis.backgroundRawCaption[tabId]
        ) {
          delete globalThis.backgroundRawCaption[tabId];
        } else {
          globalThis.rawCaption = null;
        }
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              showCaption: true,
              showEditorIfPossible: true,
              renderer: CaptionRendererType.Default,
              pageType: PageType.SearchResults,
              menuHidden: false,
              isLoadingRawCaption: false,
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
        if (
          isInBackgroundScript() &&
          globalThis.backgroundRawCaption &&
          !!globalThis.backgroundRawCaption[tabId]
        ) {
          delete globalThis.backgroundRawCaption[tabId];
        } else {
          globalThis.rawCaption = null;
        }
        return {
          ...state,
          tabData: newTabData,
          tabMeta: newTabMeta,
        };
      })
      .addCase(setIsLoadingRawCaption, (state, action) => {
        const { payload } = action;
        const { loading, percentage, tabId } = payload;
        const currentTab: TabVideoData = { ...state.tabData[tabId] };
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...currentTab,
              isLoadingRawCaption: loading,
              rawLoadPercentage: percentage,
            },
          },
        };
      })
      .addCase(hydrate, (state, action) => {
        return {
          ...state,
          ...action.payload.video,
          tabData: {
            ...state.tabData,
            ...action.payload.video.tabData,
          },
        };
      });
  }
);
