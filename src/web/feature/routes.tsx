import ProtectedRoute from "@/extension/popup/feature/login/containers/protected-route";
import { ErrorBoundary } from "react-error-boundary";
import { Route, Router } from "react-router-dom";
import { BrowseCaptionPage } from "./browse/containers/browse-caption-page";
import { CaptionEditorPage } from "./caption-editor/caption-editor-page";
import { CaptionReview } from "./caption-review/caption-review";
import { Home } from "./home/home";
import { CaptionerProfile } from "./profile/containers/captioner-profile";
import { NewProfile } from "./profile/containers/new-profile";
import { OwnProfile } from "./profile/containers/own-profile";
import { routeNames } from "./route-types";
import { SearchCaptions } from "./search/search-captions";
import { webHistory } from "./web-history";

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
        <Route path={routeNames.caption.create} exact={true}>
          <CaptionEditorPage />
        </Route>
        {/* <Route path={routeNames.caption.view} exact={true}>
          <ViewerPage />
        </Route> */}
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
