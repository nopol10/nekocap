import Spin from "antd/lib/spin";
import TwitterOutlined from "@ant-design/icons/TwitterOutlined";
import InstagramOutlined from "@ant-design/icons/InstagramOutlined";
import GithubOutlined from "@ant-design/icons/GithubOutlined";
import MenuOutlined from "@ant-design/icons/MenuOutlined";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import React, { ReactElement, useState } from "react";
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
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const { Link: AntdLink } = Typography;

const Socials = styled.div`
  display: inline-flex;
  gap: 15px;
  margin-right: auto;
  a {
    font-size: 26px;
    color: ${colors.socialIcon};
    :hover {
      color: ${colors.socialIconHovered};
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

export const WebHeader = (): ReactElement => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(isLoggedInSelector);
  const isLoggingOut = useSelector(webLogout.isLoading(undefined));
  const [showLogin, setShowLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isTablet = useSSRMediaQuery({ query: DEVICE.tablet });
  const { t } = useTranslation("common");
  const router = useRouter();

  const handleClickLogin = () => {
    setShowLogin(true);
  };

  const handleCloseLoginModal = () => {
    setShowLogin(false);
  };

  const handleClickDashboard = () => {
    setShowMobileMenu(false);
    router.push(routeNames.captioner.dashboard);
  };

  const handleClickLogout = (event: React.MouseEvent) => {
    setShowMobileMenu(false);
    setShowLogin(false);
    dispatch(webLogout.request());
  };

  const handleClickHome = (event: React.MouseEvent) => {
    setShowMobileMenu(false);
    router.push(routeNames.home);
  };

  const renderButtons = () => {
    return (
      <Buttons>
        <Spin spinning={isLoggingOut}>
          <HorizontalSpace>
            <BasicSearchBar />
            <WSButton onClick={handleClickHome}>
              {t("home.navigation.home")}
            </WSButton>
            <WSButton
              onClick={isLoggedIn ? handleClickDashboard : handleClickLogin}
            >
              {t("home.navigation.dashboard")}
            </WSButton>
            {isLoggedIn && (
              <WSButton onClick={handleClickLogout}>
                {t("home.navigation.logout")}
              </WSButton>
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
          modalProps={{ open: showLogin, onCancel: handleCloseLoginModal }}
        />
      )}
      <Socials>
        <a
          href="https://www.instagram.com/nekocaption"
          target="_blank"
          rel="noreferrer"
        >
          <InstagramOutlined />
        </a>
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
                <AntdLink onClick={handleClickHome} href="#">
                  Home
                </AntdLink>
                <Divider />
                <AntdLink
                  onClick={isLoggedIn ? handleClickDashboard : handleClickLogin}
                  href="#"
                >
                  Dashboard
                </AntdLink>
                <Divider />
                <BasicSearchBar forceOpen={true} onSearch={handleOnSearch} />
                <Divider />
                {isLoggedIn && (
                  <WSButton onClick={handleClickLogout}>Logout</WSButton>
                )}
              </MobileMenu>,
              document.body,
            )}
        </>
      )}
    </>
  );
};
