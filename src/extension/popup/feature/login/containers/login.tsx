import * as React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginWithGoogle } from "@/common/feature/login/actions";
import { Redirect } from "react-router-dom";
import { loginRoutes } from "@/common/feature/login/routes";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { PopupPage } from "@/extension/popup/common/components/popup-page";
import { NekoLogo, NekoLogoPopup } from "@/common/components/neko-logo";
import googleLoginImage from "@/assets/images/google/btn_google_signin_light_normal_web@2x.png";
import { AuthButton } from "@/common/components/auth-button";
import { ExtensionPreferences } from "./extension-preferences";
import { getImageLink } from "@/common/chrome-utils";
import styled from "styled-components";
import { Divider, Spin } from "antd";
import { VideoPageMenu } from "@/extension/content/containers/video-page-menu";
import { PopupVideoMenu } from "./popup-video-menu";

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Example of how to send a message to eventPage.ts.
    chrome.runtime.sendMessage({ popupMounted: true });
  }, []);

  const handleClickLoginGoogle = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
    }, 5000);
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
      <NekoLogoPopup />
      <Intro>
        Log in to create, upload and rate captions.
        <br />
        If you just want to view captions, you do not need to create an account.
      </Intro>
      <Spin spinning={isLoggingIn}>
        <AuthButton
          src={getImageLink(googleLoginImage)}
          onClick={handleClickLoginGoogle}
          href="#"
        />
      </Spin>
      <Divider />
      <div style={{ alignSelf: "start" }}>
        <PopupVideoMenu />
      </div>
      <Divider />
      <div style={{ alignSelf: "start", width: "100%" }}>
        <ExtensionPreferences />
      </div>
    </Page>
  );
};
