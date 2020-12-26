import * as React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginWithGoogle } from "@/common/feature/login/actions";
import { Redirect } from "react-router-dom";
import { loginRoutes } from "@/common/feature/login/routes";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { PopupPage } from "@/popup/common/components/popup-page";
import { NekoLogo } from "@/common/components/neko-logo";
import googleLoginImage from "@/assets/images/google/btn_google_signin_light_normal_web@2x.png";
import { AuthButton } from "@/common/components/auth-button";
import { ExtensionPreferences } from "./extension-preferences";
import { getImageLink } from "@/common/chrome-utils";
import styled from "styled-components";

const Page = styled(PopupPage)`
  align-items: center;
`;
const Intro = styled.div`
  margin-top: 20px;
  font-size: 16px;
`;

export const Login = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(isLoggedInSelector);
  const captionerData = useSelector(captionerSelector);

  useEffect(() => {
    // Example of how to send a message to eventPage.ts.
    chrome.runtime.sendMessage({ popupMounted: true });
  }, []);

  const handleClickLoginGoogle = () => {
    dispatch(loginWithGoogle.request({ background: false }));
  };

  if (isLoggedIn && captionerData.captioner && captionerData.captioner.name) {
    return (
      <Redirect
        to={{
          pathname: loginRoutes.popup.dashboard,
          state: { from: location },
        }}
      />
    );
  } else if (
    isLoggedIn &&
    (!captionerData.captioner || !captionerData.captioner.name)
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

  return (
    <Page>
      <NekoLogo width="80%" />
      <Intro>
        Log in to create, upload and rate captions.
        <br />
        If you just want to view captions, you do not need to create an account.
      </Intro>
      <AuthButton
        src={getImageLink(googleLoginImage)}
        onClick={handleClickLoginGoogle}
        href="#"
      />
      <ExtensionPreferences />
    </Page>
  );
};
