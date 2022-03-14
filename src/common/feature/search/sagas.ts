import {
  fork,
  takeLatest,
  call,
  put,
  throttle,
  select,
} from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { getLimitOffsetFromPagination } from "@/common/utils";
import { safe } from "@/common/redux-utils";
import {
  loadSearchResultVideoCaptions,
  search,
  searchFromBasicBar,
  setSearchNoMoreResults as setNoMoreSearchResults,
  setSearchResults,
  setSearchResultVideoCaptions,
} from "./actions";
import {
  LoadSearchResultVideoCaptions,
  SearchParams,
  SetVideoSearchResults,
  VideoSearchResults,
} from "./types";
import { routeNames } from "@/web/feature/route-types";
import { LoadCaptionsResult, VideoFields } from "../video/types";
import { searchSelector } from "./selectors";
import { populateVideoDetails } from "./api";
import { Locator } from "@/common/locator/locator";

function* searchRequestSaga(action: PayloadAction<SearchParams>) {
  const {
    pageSize,
    pageNumber,
    append = false,
    title,
    ...rest
  } = action.payload;
  const { hasMoreResults: originalHasMoreResults } = yield select(
    searchSelector
  );
  if (!originalHasMoreResults && append) {
    return;
  }
  const cleanedTitle = encodeURIComponent(title);
  const {
    status,
    error,
    videos,
    hasMoreResults,
  }: VideoSearchResults = yield call([Locator.provider(), "search"], {
    ...getLimitOffsetFromPagination(pageSize, pageNumber),
    title: cleanedTitle,
    ...rest,
  });
  if (status === "error") {
    throw new Error(error);
  }
  if (videos.length <= 0) {
    yield put(setNoMoreSearchResults());
    return;
  }

  const videosWithDetails: VideoFields[] = yield call(
    populateVideoDetails,
    videos
  );

  yield put(
    search.success({
      hasMoreResults,
      currentResultPage: pageNumber,
      videos: videosWithDetails,
      append,
    })
  );
}

function* searchSuccessSaga({
  payload: videos,
}: PayloadAction<SetVideoSearchResults>) {
  yield put(setSearchResults(videos));
}

function* loadSearchResultVideoCaptionsRequestSaga({
  payload,
}: PayloadAction<LoadSearchResultVideoCaptions>) {
  const { videoId, videoSource } = payload;
  const result: LoadCaptionsResult[] = yield call(
    [Locator.provider(), "loadCaptions"],
    {
      videoId,
      videoSource,
    }
  );
  yield put(setSearchResultVideoCaptions({ captions: result }));
}

function* searchFromBasicBarSaga({ payload: title }: PayloadAction<string>) {
  title = encodeURIComponent(title);
  window.location.href = routeNames.search.replace(":title?", title);
  yield;
}

function* searchSaga() {
  yield throttle(1000, search.REQUEST, search.requestSaga(searchRequestSaga));
  yield takeLatest(search.SUCCESS, safe(searchSuccessSaga));

  yield takeLatest(
    loadSearchResultVideoCaptions.REQUEST,
    loadSearchResultVideoCaptions.requestSaga(
      loadSearchResultVideoCaptionsRequestSaga
    )
  );

  yield takeLatest(searchFromBasicBar.type, safe(searchFromBasicBarSaga));
}

export default [fork(searchSaga)];
