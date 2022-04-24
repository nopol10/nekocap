import Space from "antd/lib/space";
import Spin from "antd/lib/spin";
import TwitterOutlined from "@ant-design/icons/TwitterOutlined";
import GithubOutlined from "@ant-design/icons/GithubOutlined";
import MenuOutlined from "@ant-design/icons/MenuOutlined";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { WSButton } from "@/common/components/ws-button";
import { webLogout } from "@/common/feature/login/actions";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { routeNames } from "../route-types";
import { LoginModal } from "./login-modal";
import { BasicSearchBar } from "./containers/basic-search-bar";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { GITHUB_URL } from "@/common/constants";
import { DEVICE } from "@/common/style-constants";
import { styledNoPass } from "@/common/style-utils";
import { Divider, Typography } from "antd";
import { isClient } from "@/common/client-utils";
import { useSSRMediaQuery } from "@/hooks";

const { Link } = Typography;

const Socials = styled.div`
  display: inline-block;
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

const MobileMenu = styledNoPass<{ open: boolean }>("div", "MobileMenu")`
  display: flex;
  flex-direction: column;
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  overflow: hidden;
  background-color: ${colors.white};
  opacity: 0;
  pointer-events: ${({ open }) => (open ? "unset" : "none")};
  transition: height 300ms, opacity 300ms;
  padding: 16px;
  ${({ open }) => (open ? "opacity: 1" : "")};
  box-sizing: border-box;
  z-index: 10;
`;

const CloseButton = styled(WSButton)``;

const Buttons = styled.div``;

const HorizontalSpace = styled.div`
  display: inline-flex;
  flex-direction: row;
  grid-column-gap: 8px;
`;

export const WebHeader = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(isLoggedInSelector);
  const isLoggingOut = useSelector(webLogout.isLoading(undefined));
  const [showLogin, setShowLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isTablet = useSSRMediaQuery({ query: DEVICE.tablet });

  const handleClickLogin = () => {
    setShowLogin(true);
  };

  const handleCloseLoginModal = () => {
    setShowLogin(false);
  };

  const handleClickDashboard = () => {
    setShowMobileMenu(false);
    window.location.href = routeNames.captioner.dashboard;
  };

  const handleClickLogout = (event: React.MouseEvent) => {
    setShowMobileMenu(false);
    setShowLogin(false);
    dispatch(webLogout.request());
  };

  const handleClickHome = (event: React.MouseEvent) => {
    setShowMobileMenu(false);
    window.location.href = routeNames.home;
  };

  const renderButtons = () => {
    return (
      <Buttons>
        <Spin spinning={isLoggingOut}>
          <HorizontalSpace>
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
          </HorizontalSpace>
        </Spin>
      </Buttons>
    );
  };

  const handleClickMobileMenu = () => {
    setShowMobileMenu(true);
  };

  const handleClickCloseMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleOnSearch = () => {
    setShowMobileMenu(false);
  };

  return (
    <>
      {!isLoggedIn && (
        <LoginModal
          modalProps={{ visible: showLogin, onCancel: handleCloseLoginModal }}
        />
      )}
      <Socials>
        <a
          href="https://www.twitter.com/nekocaption"
          target="_blank"
          rel="noreferrer"
        >
          <TwitterOutlined />
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          <GithubOutlined />
        </a>
      </Socials>
      {isTablet && renderButtons()}
      {!isTablet && (
        <>
          <WSButton style={{ marginTop: 16 }} onClick={handleClickMobileMenu}>
            <MenuOutlined />
          </WSButton>
          {isClient() &&
            ReactDOM.createPortal(
              <MobileMenu open={showMobileMenu}>
                <div style={{ textAlign: "right" }}>
                  <CloseButton onClick={handleClickCloseMobileMenu}>
                    <CloseOutlined />
                  </CloseButton>
                </div>
                <Link onClick={handleClickHome} href="#">
                  Home
                </Link>
                <Divider />
                <Link
                  onClick={isLoggedIn ? handleClickDashboard : handleClickLogin}
                  href="#"
                >
                  Dashboard
                </Link>
                <Divider />
                <BasicSearchBar forceOpen={true} onSearch={handleOnSearch} />
                <Divider />
                {isLoggedIn && (
                  <WSButton onClick={handleClickLogout}>Logout</WSButton>
                )}
              </MobileMenu>,
              document.body
            )}
        </>
      )}
    </>
  );
};
