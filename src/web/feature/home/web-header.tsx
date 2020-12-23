import Space from "antd/lib/space";
import Spin from "antd/lib/spin";
import TwitterOutlined from "@ant-design/icons/TwitterOutlined";
import GithubOutlined from "@ant-design/icons/GithubOutlined";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { WSButton } from "@/common/components/ws-button";
import { webLogout } from "@/common/feature/login/actions";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { routeNames } from "../route-types";
import { webHistory } from "../web-history";
import { LoginModal } from "./login-modal";
import { BasicSearchBar } from "./containers/basic-search-bar";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { GITHUB_URL } from "@/common/constants";

const Socials = styled.div`
  margin-right: auto;
  a {
    font-size: 26px;
    color: ${colors.socialIcon};
    :hover {
      color: ${colors.socialIconHovered};
    }
    &:not(:last-child) {
      margin-right: 15px;
    }
  }
`;

export const WebHeader = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(isLoggedInSelector);
  const isLoggingOut = useSelector(webLogout.isLoading(undefined));
  const [showLogin, setShowLogin] = useState(false);

  const handleClickLogin = () => {
    setShowLogin(true);
  };

  const handleCloseLoginModal = () => {
    setShowLogin(false);
  };

  const handleClickDashboard = () => {
    webHistory.push(routeNames.captioner.dashboard);
  };

  const handleClickLogout = (event: React.MouseEvent) => {
    setShowLogin(false);
    dispatch(webLogout.request());
  };

  const handleClickHome = (event: React.MouseEvent) => {
    webHistory.push(routeNames.home);
  };

  return (
    <>
      {!isLoggedIn && (
        <LoginModal
          modalProps={{ visible: showLogin, onCancel: handleCloseLoginModal }}
        />
      )}
      <Socials>
        <a href="https://www.twitter.com/nekocaption" target="_blank">
          <TwitterOutlined />
        </a>
        <a href={GITHUB_URL} target="_blank">
          <GithubOutlined />
        </a>
      </Socials>
      <Spin spinning={isLoggingOut}>
        <Space>
          <BasicSearchBar />
          <WSButton onClick={handleClickHome}>Home</WSButton>
          <WSButton
            onClick={isLoggedIn ? handleClickDashboard : handleClickLogin}
          >
            Dashboard
          </WSButton>
          {isLoggedIn && (
            <WSButton onClick={handleClickLogout}>Logout</WSButton>
          )}
        </Space>
      </Spin>
    </>
  );
};
