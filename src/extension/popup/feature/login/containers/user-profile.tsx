import * as React from "react";
import { useSelector } from "react-redux";
import { loginRoutes } from "@/common/feature/login/routes";
import { userDataSelector } from "@/common/feature/login/selectors";
import { appHistory } from "@/extension/popup/common/store";
import { PopupPage } from "@/extension/popup/common/components/popup-page";
import { NewProfileForm } from "@/common/feature/login/containers/new-profile-form";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { Redirect } from "react-router-dom";

export const UserProfile = () => {
  const userData = useSelector(userDataSelector);
  const captioner = useSelector(captionerSelector);
  if (!userData) {
    return null;
  }
  // This is to prevent a late update of the state from preventing the user's submission from
  // bringing them to the popup dashboard.
  // The update delay is likely due to how reduxed-chrome-storage works.
  const isProfileSetupComplete = !!captioner.captioner?.name;

  const handleSubmitSuccess = () => {
    appHistory.push(loginRoutes.popup.dashboard);
  };

  return (
    <>
      {isProfileSetupComplete && (
        <Redirect
          to={{
            pathname: loginRoutes.popup.dashboard,
            state: { from: location },
          }}
        />
      )}
      <PopupPage width={"450px"}>
        <NewProfileForm onSubmitSuccess={handleSubmitSuccess} />
      </PopupPage>
    </>
  );
};
