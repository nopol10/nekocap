import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { RouteProps } from "react-router";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { routeNames } from "./route-types";
import { Skeleton } from "antd";

type ProtectedRouteType = RouteProps;

const ProtectedRoute = ({ children, ...rest }: ProtectedRouteType) => {
  const isLoggedIn = useSelector(isLoggedInSelector);
  const captioner = useSelector(captionerSelector);

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (!isLoggedIn) {
          return <Redirect to={{ pathname: "/", state: { from: location } }} />;
        }
        if (isLoggedIn && !captioner.captioner) {
          return <Skeleton active={true} />;
        }
        if (!captioner.captioner.name && rest.path !== routeNames.profile.new) {
          return (
            <Redirect
              to={{
                pathname: routeNames.profile.new,
                state: { from: location },
              }}
            />
          );
        }
        return children;
      }}
    />
  );
};

export default ProtectedRoute;
