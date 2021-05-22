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
  search,
  searchFromBasicBar,
  setSearchNoMoreResults as setNoMoreSearchResults,
  setSearchResults,
} from "./actions";
import {
  SearchParams,
  SetVideoSearchResults,
  VideoSearchResults,
} from "./types";
import { routeNames } from "@/web/feature/route-types";
import { VideoFields } from "../video/types";
import { webHistory } from "@/web/feature/web-history";
import { searchSelector } from "./selectors";
import { populateVideoDetails } from "./api";
import { Locator } from "@/common/locator/locator";

function* searchRequestSaga(action: PayloadAction<SearchParams>) {
  const { pageSize, pageNumber, append = false, ...rest } = action.payload;
  const { hasMoreResults: originalHasMoreResults } = yield select(
    searchSelector
  );
  if (!originalHasMoreResults && append) {
    return;
  }
  const { status, error, videos, hasMoreResults }: VideoSearchResults =
    yield call([Locator.provider(), "search"], {
      ...getLimitOffsetFromPagination(pageSize, pageNumber),
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

function* searchFromBasicBarSaga({ payload: title }: PayloadAction<string>) {
  window.location.href = routeNames.search.replace(":title?", title);
  yield;
}

function* searchSaga() {
  yield throttle(1000, search.REQUEST, search.requestSaga(searchRequestSaga));
  yield takeLatest(search.SUCCESS, safe(searchSuccessSaga));

  yield takeLatest(searchFromBasicBar.type, safe(searchFromBasicBarSaga));
}

export default [fork(searchSaga)];
