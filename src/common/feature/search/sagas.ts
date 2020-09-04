import { fork, takeLatest, call, put } from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { getLimitOffsetFromPagination } from "@/common/utils";
import { safe } from "@/common/redux-utils";
import { search, searchFromBasicBar, setSearchResults } from "./actions";
import {
  SearchParams,
  SetVideoSearchResults,
  VideoSearchResults,
} from "./types";
import { routeNames } from "@/web/feature/route-types";
import { VideoFields } from "../video/types";
import { webHistory } from "@/web/feature/web-history";
import { videoSourceToProcessorMap } from "../video/utils";

const populateVideoDetails = async (
  videos: VideoFields[]
): Promise<VideoFields[]> => {
  const updatedCaptions = await Promise.all(
    videos.map(async (video) => {
      const processor = videoSourceToProcessorMap[parseInt(video.source)];
      if (!processor) {
        return video;
      }
      const thumbnailUrl = await processor.generateThumbnailLink(
        video.sourceId
      );
      return {
        ...video,
        thumbnailUrl,
      };
    })
  );
  return updatedCaptions;
};

function* searchRequestSaga(action: PayloadAction<SearchParams>) {
  const { pageSize, pageNumber, append = false, ...rest } = action.payload;
  const {
    status,
    error,
    videos,
    hasMoreResults,
  }: VideoSearchResults = yield call(window.backendProvider.search, {
    ...getLimitOffsetFromPagination(pageSize, pageNumber),
    ...rest,
  });
  if (status === "error") {
    throw new Error(error);
  }

  const videosWithDetails = yield call(populateVideoDetails, videos);

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
  webHistory.push(routeNames.search.replace(":title?", title));
}

function* searchSaga() {
  yield takeLatest(search.REQUEST, search.requestSaga(searchRequestSaga));
  yield takeLatest(search.SUCCESS, safe(searchSuccessSaga));

  yield takeLatest(searchFromBasicBar.type, safe(searchFromBasicBarSaga));
}

export default [fork(searchSaga)];
