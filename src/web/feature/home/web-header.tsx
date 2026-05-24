import { isClient } from "@/common/client-utils";
import { colors } from "@/common/colors";
import { WSButton } from "@/common/components/ws-button";
import { GITHUB_URL } from "@/common/constants";
import { webLogout } from "@/common/feature/login/actions";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { DEVICE } from "@/common/style-constants";
import { useSSRMediaQuery } from "@/hooks";
import CloseOutlined from "@ant-design/icons/CloseOutlined";
import GithubOutlined from "@ant-design/icons/GithubOutlined";
import InstagramOutlined from "@ant-design/icons/InstagramOutlined";
import MenuOutlined from "@ant-design/icons/MenuOutlined";
import TwitterOutlined from "@ant-design/icons/TwitterOutlined";
import { Divider, Spin, Typography } from "antd";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { ReactElement, useState } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { routeNames } from "../route-types";
import { NekoLogo } from "./components/neko-logo";
import { BasicSearchBar } from "./containers/basic-search-bar";
import { LoginModal } from "./login-modal";

const { Link: AntdLink } = Typography;

const BrandArea = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 64px;

  svg {
    display: block;
    height: 32px;
    width: auto;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const NavArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const Socials = styled.div`
  display: inline-flex;
  gap: 6px;
  border-right: 1px solid #e8e8e8;
  padding-right: 12px;
  margin-right: 6px;

  a {
    font-size: 26px;
    color: ${colors.socialIcon};
    display: flex;
    align-items: center;

    &:hover {
      color: ${colors.socialIconHovered};
    }
  }
`;

const NavLink = styled.a`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
  text-decoration: none;
  padding: 0 8px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: ${colors.base};
    background: ${colors.lightHighlight};
  }
`;

const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: ${colors.text};
  font-weight: 600;
  font-size: 14px;
  padding: 0 14px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #d0d0d0;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s,
    background 0.2s;

  &:hover {
    border-color: ${colors.secondary};
    color: ${colors.secondary};
    background: ${colors.lightHighlight};
  }
`;

const SearchSlot = styled.div`
  display: inline-flex;
  align-items: center;

  form {
    display: flex;
    align-items: center;
  }

  .ant-input {
    height: 36px;
    border-radius: 8px;
    border: 1px solid #d0d0d0;
    font-size: 14px;
  }

  .ant-input:focus,
  .ant-input-focused {
    border-color: ${colors.secondary};
    box-shadow: none;
  }

  .ant-btn {
    height: 36px;
    min-width: 36px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid #d0d0d0;
    color: ${colors.text};
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    transition:
      border-color 0.2s,
      color 0.2s,
      background 0.2s;
  }

  .ant-btn:hover {
    border-color: ${colors.secondary};
    color: ${colors.secondary};
    background: ${colors.lightHighlight};
  }
`;

const MobileMenu = styled.div<{ $open: boolean }>`
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
  pointer-events: ${({ $open }) => ($open ? "unset" : "none")};
  transition:
    height 300ms,
    opacity 300ms;
  padding: 16px;
  ${({ $open }) => ($open ? "opacity: 1" : "")};
  box-sizing: border-box;
  z-index: 10;
`;

const CloseButton = styled(WSButton)``;

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

      <BrandArea>
        <NekoLogo $height="32px" />
      </BrandArea>

      <Spacer />

      <NavArea>
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

        {isTablet && (
          <>
            <NavLink href="/#features">
              {t("home.navigation.features")}
            </NavLink>
            <Link href={routeNames.caption.browse} passHref legacyBehavior>
              <NavLink>{t("home.navigation.browse")}</NavLink>
            </Link>
            <SearchSlot>
              <BasicSearchBar />
            </SearchSlot>
            <Spin spinning={isLoggingOut}>
              <GhostBtn
                onClick={isLoggedIn ? handleClickDashboard : handleClickLogin}
              >
                {t("home.navigation.dashboard")}
              </GhostBtn>
              {isLoggedIn && (
                <GhostBtn
                  onClick={handleClickLogout}
                  style={{ marginLeft: 8 }}
                >
                  {t("home.navigation.logout")}
                </GhostBtn>
              )}
            </Spin>
          </>
        )}

        {!isTablet && (
          <>
            <WSButton style={{ marginTop: 0 }} onClick={handleClickMobileMenu}>
              <MenuOutlined />
            </WSButton>
            {isClient() &&
              ReactDOM.createPortal(
                <MobileMenu $open={showMobileMenu}>
                  <div style={{ textAlign: "right" }}>
                    <CloseButton onClick={handleClickCloseMobileMenu}>
                      <CloseOutlined />
                    </CloseButton>
                  </div>
                  <AntdLink onClick={handleClickHome} href="#">
                    {t("home.navigation.home")}
                  </AntdLink>
                  <Divider />
                  <AntdLink href="/#features">
                    {t("home.navigation.features")}
                  </AntdLink>
                  <Divider />
                  <Link href={routeNames.caption.browse} passHref legacyBehavior>
                    <AntdLink>{t("home.navigation.browse")}</AntdLink>
                  </Link>
                  <Divider />
                  <AntdLink
                    onClick={
                      isLoggedIn ? handleClickDashboard : handleClickLogin
                    }
                    href="#"
                  >
                    {t("home.navigation.dashboard")}
                  </AntdLink>
                  <Divider />
                  <BasicSearchBar forceOpen={true} onSearch={handleOnSearch} />
                  <Divider />
                  {isLoggedIn && (
                    <WSButton onClick={handleClickLogout}>
                      {t("home.navigation.logout")}
                    </WSButton>
                  )}
                </MobileMenu>,
                document.body,
              )}
          </>
        )}
      </NavArea>
    </>
  );
};
