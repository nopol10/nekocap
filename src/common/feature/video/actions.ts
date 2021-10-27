import { createAction } from "@reduxjs/toolkit";
import {
  createSignalActionInState,
  createThunkedActionCreator,
} from "@/common/store/action";
import type { TabbedType } from "@/common/types";
import { videoActionTypes } from "./action-types";
import type {
  RequestFreshTabData,
  LoadServerCaption,
  LoadCaptions,
  SetServerCaptions,
  SetShowCaption,
  SetCaption,
  UpdateLoadedCaptionFromFile,
  SetRenderer,
  SetContentPageType,
  SetMenuHidden,
  SetVideoDimensions,
  SetFontList,
} from "./types";

const csa = createSignalActionInState("video", true);

export const loadCaptions = csa<LoadCaptions>(videoActionTypes.loadCaptions);

export const loadServerCaption = csa<LoadServerCaption>(
  videoActionTypes.loadServerCaption
);

export const loadWebsiteViewerCaption = csa<LoadServerCaption>(
  videoActionTypes.loadWebsiteViewerCaption
);

/**
 * To be fired upon clicking the like button on a caption.
 * Note that this can mean that the user either wants to unlike an already liked caption
 * or to like a previously unliked or disliked caption.
 * Opposite goes for dislikeCaption
 */
export const likeCaption = csa<TabbedType, TabbedType>(
  videoActionTypes.likeCaption
);
export const dislikeCaption = csa<TabbedType, TabbedType>(
  videoActionTypes.dislikeCaption
);

export const updateLoadedCaptionFromFile = createThunkedActionCreator<
  UpdateLoadedCaptionFromFile
>(videoActionTypes.updateLoadedCaptionFromFile);

export const updateShowCaption = createAction<SetShowCaption>(
  videoActionTypes.updateShowCaption
);

export const updateRenderer = createAction<SetRenderer>(
  videoActionTypes.updateRenderer
);

export const closeMenuBar = createAction<TabbedType>(
  videoActionTypes.closeMenuBar
);

export const openMenuBar = createAction<TabbedType>(
  videoActionTypes.openMenuBar
);

export const requestFreshTabData = createAction<RequestFreshTabData>(
  videoActionTypes.requestFreshTabData
);

export const clearTabData = createAction<TabbedType>(
  videoActionTypes.clearTabData
);

export const closeTab = createAction<TabbedType>(videoActionTypes.closeTab);

export const unsetTabData = createAction<TabbedType>(
  videoActionTypes.unsetTabData
);

export const setContentPageType = createAction<SetContentPageType>(
  videoActionTypes.setContentPageType
);

export const setLoadedCaption = createAction<SetCaption>(
  videoActionTypes.setCaption
);

export const setShowCaption = createAction<SetShowCaption>(
  videoActionTypes.setShowCaption
);

export const setServerCaptions = createAction<SetServerCaptions>(
  videoActionTypes.setServerCaptions
);

export const setRenderer = createAction<SetRenderer>(
  videoActionTypes.setRenderer
);

export const setVideoDimensions = createAction<SetVideoDimensions>(
  videoActionTypes.setVideoDimensions
);

export const setMenuHidden = createAction<SetMenuHidden>(
  videoActionTypes.setMenuHidden
);

export const setFontList = createAction<SetFontList>(
  videoActionTypes.setFontList
);
