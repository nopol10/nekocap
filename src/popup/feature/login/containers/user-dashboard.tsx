import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/common/feature/login/actions";
import { userDataSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import styled from "styled-components";
import { Button, Typography } from "antd";
import { NekoLogo } from "@/common/components/neko-logo";
import { PopupPage } from "@/popup/common/components/popup-page";
const { Link, Title } = Typography;

const HelloText = styled.div`
  font-size: 14px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const SiteLink = styled(Link)`
  font-weight: bold;
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
      <ul>
        <li>
          <SiteLink href="https://www.youtube.com/" target="_blank">
            Youtube
          </SiteLink>
        </li>
        <li>
          <SiteLink href="https://www.nicovideo.jp/" target="_blank">
            niconico
          </SiteLink>
        </li>
        <li>
          <SiteLink href="https://vimeo.com/" target="_blank">
            Vimeo
          </SiteLink>
        </li>
        <li>
          <SiteLink href="https://www.bilibili.com/" target="_blank">
            bilibili
          </SiteLink>
        </li>
        <li>
          <SiteLink href="https://tver.jp/" target="_blank">
            TVer
          </SiteLink>
        </li>
      </ul>
      <Buttons>
        <Button onClick={handleClickLogout}>Logout</Button>
      </Buttons>
    </PopupPage>
  );
};
