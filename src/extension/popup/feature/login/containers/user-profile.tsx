import { Typography } from "antd";
import * as React from "react";
import { useSelector } from "react-redux";
import { loginRoutes } from "@/common/feature/login/routes";
import { userDataSelector } from "@/common/feature/login/selectors";
import { appHistory } from "@/extension/popup/common/store";
import { PopupPage } from "@/extension/popup/common/components/popup-page";
import { NewProfileForm } from "@/common/feature/login/containers/new-profile-form";

export const UserProfile = () => {
  const userData = useSelector(userDataSelector);
  if (!userData) {
    return null;
  }

  const handleSubmitSuccess = () => {
    appHistory.push(loginRoutes.popup.dashboard);
  };

  return (
    <PopupPage width={"450px"}>
      <NewProfileForm onSubmitSuccess={handleSubmitSuccess} />
    </PopupPage>
  );
};
