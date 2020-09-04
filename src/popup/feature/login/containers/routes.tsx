import { Route } from "react-router-dom";
import React from "react";
import { loginRoutes } from "@/common/feature/login/routes";
import ProtectedRoute from "./protected-route";
import { UserDashboard } from "./user-dashboard";
import { Login } from "./login";
import { UserProfile } from "./user-profile";

export default function () {
  return (
    <>
      <Route exact path={["/", loginRoutes.popup.login]}>
        <Login />
      </Route>
      <ProtectedRoute exact path={loginRoutes.popup.profile}>
        <UserProfile />
      </ProtectedRoute>
      <ProtectedRoute exact path={loginRoutes.popup.dashboard}>
        <UserDashboard />
      </ProtectedRoute>
    </>
  );
}
