import React, { useEffect, useState } from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { RouteProps } from "react-router";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { loginRoutes } from "@/common/feature/login/routes";
import { Button, Skeleton } from "antd";
import { PopupPage } from "@/extension/popup/common/components/popup-page";

type ProtectedRouteType = RouteProps;

const LoadingPage = () => {
  const [showReload, setShowReload] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShowReload(true);
    }, 2500);
  }, []);

  const handleReload = () => {
    chrome.runtime.reload();
  };
  return (
    <PopupPage>
      <Skeleton active={true} />
      {showReload && (
        <div style={{ textAlign: "center" }}>
          <div>Taking too long?</div>
          <Button
            onClick={handleReload}
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
            Reload
          </Button>
        </div>
      )}
    </PopupPage>
  );
};

const ProtectedRoute = ({ children, ...rest }: ProtectedRouteType) => {
  const isLoggedIn = useSelector(isLoggedInSelector);
  const captioner = useSelector(captionerSelector);

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (!isLoggedIn) {
          return (
            <Redirect
              to={{
                pathname: loginRoutes.popup.login,
                state: { from: location },
              }}
            />
          );
        }
        if (isLoggedIn && !captioner.captioner) {
          return <LoadingPage />;
        }

        if (
          !captioner.captioner.name &&
          rest.path !== loginRoutes.popup.profile
        ) {
          return (
            <Redirect
              to={{
                pathname: loginRoutes.popup.profile,
                state: { from: location },
              }}
            />
          );
        }
        return <Route {...rest}>{children}</Route>;
      }}
    />
  );
};

export default ProtectedRoute;
