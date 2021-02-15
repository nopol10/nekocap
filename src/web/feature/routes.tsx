import React from "react";
import { Router, Route } from "react-router-dom";
import { Home } from "./home/home";
import ProtectedRoute from "./protected-route";
import { routeNames } from "./route-types";
import { OwnProfile } from "./profile/containers/own-profile";
import { CaptionReview } from "./caption-review/caption-review";
import { SearchCaptions } from "./search/search-captions";
import { ErrorBoundary } from "react-error-boundary";
import { NewProfile } from "./profile/containers/new-profile";
import { webHistory } from "./web-history";
import { CaptionerProfile } from "./profile/containers/captioner-profile";
import { BrowseCaptionPage } from "./browse/containers/browse-caption-page";
import { ViewerPage } from "./viewer/viewer-page";

export const Routes = () => {
  return (
    <>
      <Router history={webHistory}>
        <Route path={routeNames.home} exact={true}>
          <Home />
        </Route>
        <Route path={routeNames.caption.browse} exact={true}>
          <BrowseCaptionPage />
        </Route>
        <Route path={routeNames.caption.view} exact={true}>
          <ViewerPage />
        </Route>
        <Route path={routeNames.profile.main} exact={true}>
          <CaptionerProfile />
        </Route>
        <Route path={routeNames.search} exact={true}>
          <SearchCaptions />
        </Route>
        <ProtectedRoute path={routeNames.profile.new} exact={true}>
          <NewProfile />
        </ProtectedRoute>
        <ProtectedRoute path={routeNames.captioner.dashboard} exact={true}>
          <OwnProfile />
        </ProtectedRoute>
        <ProtectedRoute path={routeNames.caption.main} exact={true}>
          <ErrorBoundary
            FallbackComponent={() => (
              <div>There was an error rendering this caption. Sorry!</div>
            )}
          >
            <CaptionReview />
          </ErrorBoundary>
        </ProtectedRoute>
      </Router>
    </>
  );
};
