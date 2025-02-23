import chromeLogo from "@/assets/images/chrome-web-store-badge.png";
import discordLogo from "@/assets/images/discord.png";
import firefoxLogo from "@/assets/images/firefox-get-the-addon-badge.png";
import { colors } from "@/common/colors";
import { Badges } from "@/common/components/badges";
import { NekoLogo } from "@/common/components/neko-logo";
import { WSLayout } from "@/common/components/ws-layout";
import { WSLinkButton } from "@/common/components/ws-link-button";
import { WSTitle } from "@/common/components/ws-title";
import {
  CHROME_DOWNLOAD_URL,
  DISCORD_INVITE_URL,
  FIREFOX_DOWNLOAD_URL,
  GITHUB_URL,
} from "@/common/constants";
import { DEVICE } from "@/common/style-constants";
import { Alert, Col, Row } from "antd";
import Layout from "antd/lib/layout";
import { Trans, useTranslation } from "next-i18next";
import Image from "next/image";
import { ReactElement } from "react";
import styled from "styled-components";
import { KofiWidget } from "../common/containers/kofi-widget";
import { routeNames } from "../route-types";
import { FeatureList } from "./components/feature-list";
import { Instructions } from "./components/instructions";
import { LatestCaptions } from "./containers/latest-captions";
import { LatestUserLanguageCaptions } from "./containers/latest-user-language-caps";

const { Content } = Layout;

const MainLogo = styled.div`
  @keyframes tilt {
    0% {
      transform: rotate(-4deg);
    }
    70% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
  padding-top: 64px;
  font-size: 64px;
  background-color: ${colors.white};

  svg {
    position: relative;
    height: 12vw;

    @media ${DEVICE.tablet} {
      height: 80px;
    }

    .nekocap_svg__cat-wrapper {
      transform-origin: center;
      animation: tilt 900ms infinite alternate;
    }
  }

  div {
    font-size: 16px;
    font-family: monospace;
  }
`;

const DividerWrapper = styled.div`
  height: 75px;
  overflow: hidden;
  position: relative;
  width: 100vw;
  left: 50%;
  transform: translateX(-50%);
  @media ${DEVICE.tablet} {
    height: 150px;
  }
`;

const WaveDivider = () => {
  return (
    <DividerWrapper>
      <svg
        viewBox="0 0 500 150"
        preserveAspectRatio="none"
        style={{ height: "100%", width: "100%" }}
      >
        <path
          d="M0.00,49.98 C122.74,160.36 310.10,2.47 500.00,49.98 L500.00,0.00 L0.00,0.00 Z"
          style={{ stroke: "none", fill: colors.white }}
        ></path>
      </svg>
    </DividerWrapper>
  );
};

const BrowseCaptionButton = styled(WSLinkButton)`
  display: flex;
  margin-top: 20px;
  margin-bottom: 20px;
  height: unset;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  border-color: ${colors.ctaBorder};
  color: ${colors.ctaText};
  width: 100%;
  &.ant-btn-lg {
    line-height: unset;
  }
  @media ${DEVICE.tablet} {
    font-size: 32px;
  }
`;

const CaptionDigestGrid = () => {
  return (
    <>
      <Row gutter={[24, 24]} justify={"center"}>
        <Col span={12} lg={12} md={24} sm={24} xs={24}>
          <LatestCaptions />
        </Col>
        <Col span={12} lg={12} md={24} sm={24} xs={24}>
          <LatestUserLanguageCaptions />
        </Col>
      </Row>
    </>
  );
};

export const Home = (): ReactElement => {
  const { t } = useTranslation("common");
  return (
    <>
      <KofiWidget />
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          marginTop: "-64px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <MainLogo>
            <NekoLogo />
            <div>(alpha)</div>
          </MainLogo>
        </div>
        <WSLayout style={{ height: "100%", paddingBottom: 20 }}>
          <Content style={{ padding: "0 40px", overflowX: "hidden" }}>
            <WaveDivider />
            <WSTitle level={2} textAlign={"center"}>
              <Trans
                i18nKey={"home.summary"}
                components={{
                  bold: <em />,
                  open: (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={GITHUB_URL}
                      style={{ fontWeight: "bold" }}
                    />
                  ),
                }}
              ></Trans>
            </WSTitle>
            <Badges>
              <a target="_blank" rel="noreferrer" href={CHROME_DOWNLOAD_URL}>
                <Image
                  id="chrome-badge"
                  src={chromeLogo.src}
                  width={200}
                  height={60}
                  alt={t("home.chromeBadgeAlt")}
                />
              </a>
              <a target="_blank" rel="noreferrer" href={FIREFOX_DOWNLOAD_URL}>
                <Image
                  id="firefox-badge"
                  src={firefoxLogo.src}
                  width={172}
                  height={60}
                  alt={t("home.firefoxBadgeAlt")}
                />
              </a>
            </Badges>
            <Badges>
              <a target="_blank" rel="noreferrer" href={DISCORD_INVITE_URL}>
                <Image
                  id="discord-badge"
                  src={discordLogo.src}
                  width={188}
                  height={60}
                  alt={t("home.discordBadgeAlt")}
                />
              </a>
            </Badges>
            <Alert
              style={{
                margin: "0 auto 16px",
                maxWidth: "650px",
                fontSize: "1.05em",
              }}
              showIcon
              message={t("home.twitterSuspensionNotice")}
            />
            <FeatureList />
            <Instructions />
            <BrowseCaptionButton
              size={"large"}
              href={routeNames.caption.browse}
            >
              {t("home.browseAllCaptions")}
            </BrowseCaptionButton>
            <CaptionDigestGrid />
          </Content>
        </WSLayout>
      </div>
    </>
  );
};
