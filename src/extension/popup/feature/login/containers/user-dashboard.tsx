import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/common/feature/login/actions";
import { userDataSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import styled from "styled-components";
import { Button, Divider } from "antd";
import { NekoLogoPopup } from "@/common/components/neko-logo";
import { PopupPage } from "@/extension/popup/common/components/popup-page";
import { SupportedSites } from "@/common/components/supported-sites";
import { ExtensionPreferences } from "./extension-preferences";
import { PopupVideoMenu } from "./popup-video-menu";

const HelloText = styled.div`
  font-size: 14px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const Buttons = styled.div`
  margin-top: auto;
  text-align: right;
`;

export const UserDashboard = () => {
  const dispatch = useDispatch();
  const userData = useSelector(userDataSelector);
  const captionerData = useSelector(captionerSelector);
  if (!userData || !captionerData) {
    return null;
  }

  const handleClickLogout = () => {
    dispatch(logout.request());
  };

  return (
    <PopupPage>
      <NekoLogoPopup />
      <HelloText>
        Hello{" "}
        <a
          href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || ""}dashboard`}
          rel="noreferrer"
          target="_blank"
        >
          <b>{captionerData.captioner?.name}</b>
        </a>
      </HelloText>
      <div>
        Visit one of the supported sites to start viewing and creating captions:
      </div>
      <SupportedSites />
      <Divider />
      <PopupVideoMenu />
      <Divider />
      <ExtensionPreferences />
      <Buttons>
        <Button onClick={handleClickLogout}>Logout</Button>
      </Buttons>
    </PopupPage>
  );
};
