import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/common/feature/login/actions";
import { userDataSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import styled from "styled-components";
import { Button } from "antd";
import { NekoLogo } from "@/common/components/neko-logo";
import { PopupPage } from "@/extension/popup/common/components/popup-page";
import { SupportedSites } from "@/common/components/supported-sites";
import { ExtensionPreferences } from "./extension-preferences";

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
      <NekoLogo />
      <HelloText>
        Hello <b>{captionerData.captioner.name}</b>
      </HelloText>
      <div>
        Visit one of the supported sites to start viewing and creating captions:
      </div>
      <SupportedSites />
      <ExtensionPreferences />
      <Buttons>
        <Button onClick={handleClickLogout}>Logout</Button>
      </Buttons>
    </PopupPage>
  );
};
