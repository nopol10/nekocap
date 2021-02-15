import React from "react";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { WSLayout } from "@/common/components/ws-layout";
import Layout from "antd/lib/layout";
import { WSTitle } from "@/common/components/ws-title";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import "./home.scss";
import chromeLogo from "@/assets/images/chrome-web-store-badge.png";
import firefoxLogo from "@/assets/images/firefox-get-the-addon-badge.png";
import discordLogo from "@/assets/images/discord.png";
import { LatestCaptions } from "./containers/latest-captions";
import { LatestUserLanguageCaptions } from "./containers/latest-user-language-caps";
import { getBaseLanguageName } from "@/common/languages";
import { PopularCaptions } from "./containers/popular-captions";
import { NekoLogo } from "@/common/components/neko-logo";
import { Instructions } from "./components/instructions";
import { FeatureList } from "./components/feature-list";
import {
  CHROME_DOWNLOAD_URL,
  DISCORD_INVITE_URL,
  FIREFOX_DOWNLOAD_URL,
  GITHUB_URL,
} from "@/common/constants";
import { routeNames } from "../route-types";
import { WSButton } from "@/common/components/ws-button";
import { Badges } from "@/common/components/badges";

const { Content } = Layout;
const { Link } = Typography;

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
    height: 80px;
    z-index: 100;
    position: relative;

    .cat-wrapper {
      transform-origin: center;
      animation: tilt 900ms infinite alternate;
    }
  }

  div {
    font-size: 16px;
    font-family: monospace;
  }
`;

const WaveDivider = () => {
  return (
    <div
      style={{
        height: "150px",
        overflow: "hidden",
        position: "relative",
        width: "100vw",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
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
    </div>
  );
};

const DataCard = styled(Card)`
  .ant-card-head {
    padding-left: 16px;
    padding-right: 16px;
  }
  .ant-card-body {
    padding: 0;
  }
`;

const BrowseCaptionButton = styled(WSButton)`
  display: flex;
  margin-top: 20px;
  margin-bottom: 20px;
  padding-bottom: 0;
  height: unset;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  border-color: ${colors.ctaBorder};
  color: ${colors.ctaText};
  &.ant-btn-lg {
    line-height: unset;
  }
`;

const CaptionDigestGrid = () => {
  return (
    <>
      <Row gutter={[24, 24]} justify={"center"}>
        <Col span={12} lg={12} md={12} sm={24} xs={24}>
          <DataCard title={"Latest captions"}>
            <LatestCaptions />
          </DataCard>
        </Col>
        <Col span={12} lg={12} md={12} sm={24} xs={24}>
          <DataCard
            title={`Latest ${getBaseLanguageName(navigator.language)} captions`}
          >
            <LatestUserLanguageCaptions />
          </DataCard>
        </Col>
        {/* <Col span={8} lg={8} md={12} sm={24} xs={24}>
          <DataCard title={"Popular captions"}>
            <PopularCaptions />
          </DataCard>
        </Col> */}
      </Row>
    </>
  );
};

export const Home = () => {
  return (
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
      <WSLayout style={{ height: "100%" }}>
        <Content style={{ padding: "0 40px", overflowX: "hidden" }}>
          <WaveDivider />
          <WSTitle level={2} textAlign={"center"}>
            <em>View</em>, <em>create</em> and <em>share</em> your captions
            <br />
            with this{" "}
            <em>
              <a target="_blank" rel="noreferrer" href={GITHUB_URL}>
                open source
              </a>
            </em>{" "}
            browser extension
          </WSTitle>
          <Badges>
            <Space>
              <a target="_blank" rel="noreferrer" href={CHROME_DOWNLOAD_URL}>
                <img id="chrome-badge" src={chromeLogo} />
              </a>
              <a target="_blank" rel="noreferrer" href={FIREFOX_DOWNLOAD_URL}>
                <img id="firefox-badge" src={firefoxLogo} />
              </a>
            </Space>
          </Badges>
          <Badges>
            <a target="_blank" rel="noreferrer" href={DISCORD_INVITE_URL}>
              <img id="discord-badge" src={discordLogo} />
            </a>
          </Badges>
          <FeatureList />
          <Instructions />
          <BrowseCaptionButton size={"large"} href={routeNames.caption.browse}>
            Browse all captions
          </BrowseCaptionButton>
          <CaptionDigestGrid />
        </Content>
      </WSLayout>
    </div>
  );
};
