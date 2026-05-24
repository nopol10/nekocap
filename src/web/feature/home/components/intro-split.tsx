import { colors } from "@/common/colors";
import { CaptionListFields } from "@/common/feature/video/types";
import { formatThousands } from "@/common/format";
import { useHomepageStats } from "@/common/hooks/use-homepage-stats";
import {
  CHROME_DOWNLOAD_URL,
  FIREFOX_DOWNLOAD_URL,
  GITHUB_URL,
} from "@/common/constants";
import { DEVICE } from "@/common/style-constants";
import DownloadOutlined from "@ant-design/icons/DownloadOutlined";
import GithubOutlined from "@ant-design/icons/GithubOutlined";
import RightOutlined from "@ant-design/icons/RightOutlined";
import { Spin } from "antd";
import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import React, { ReactElement } from "react";
import styled, { keyframes } from "styled-components";
import { routeNames } from "../../route-types";
import { CaptionTile } from "./caption-tile";

const ping = keyframes`
  0% { transform: scale(1); opacity: 1; }
  75%, 100% { transform: scale(2); opacity: 0; }
`;

const drift = keyframes`
  0% { --gradientX: 20%; --gradientY: 15%; }
  50% { --gradientX: 65%; --gradientY: 35%; }
  100% { --gradientX: 40%; --gradientY: 20%; }
`;

const Section = styled.section`
  @property --gradientX {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 20%;
  }
  @property --gradientY {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 15%;
  }

  position: relative;
  display: flex;
  align-items: center;
  padding-top: 96px;
  padding-bottom: 64px;
  overflow: hidden;
  animation: ${drift} 8s ease-in-out infinite alternate;
  background: radial-gradient(
    ellipse at var(--gradientX) var(--gradientY),
    #fff8ef 0%,
    #fcfaf9 40%,
    #eef8fc 100%
  );

  &::before {
    content: "";
    position: absolute;
    top: -120px;
    left: -80px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      ${colors.alternate}44 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -100px;
    right: -60px;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      ${colors.secondary}33 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  @media (min-width: 1080px) {
    min-height: calc(100vh - 64px);
  }
`;

const Inner = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;

  @media (min-width: 1080px) {
    grid-template-columns: 1fr 1.05fr;
    gap: 56px;
    padding: 0 40px;
  }
`;

const IntroCopy = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
`;

const EyebrowPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.text};
  width: fit-content;
`;

const PulseDot = styled.span`
  position: relative;
  display: inline-flex;
  width: 10px;
  height: 10px;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: ${colors.secondary};
    animation: ${ping} 1.4s ease-out infinite;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: 50%;
    background: ${colors.secondary};
  }
`;

const H1 = styled.h1`
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 600;
  line-height: 1.15;
  color: #1a1a1a;
  margin: 0;

  em {
    font-style: normal;
    color: ${colors.base};
    position: relative;
    display: inline;

    &::after {
      content: "";
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      height: 8px;
      background: ${colors.alternate};
      z-index: -1;
      border-radius: 2px;
    }
  }
`;

const Lede = styled.p`
  font-size: 16px;
  line-height: 1.55;
  color: ${colors.text};
  margin: 0;
  max-width: 540px;

  strong {
    color: #1a1a1a;
    font-weight: 600;
  }
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const PrimaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${colors.base};
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  padding: 0 22px;
  height: 44px;
  border-radius: 8px;
  text-decoration: none;
  transition:
    background 0.2s,
    transform 0.15s;

  &:hover {
    background: #ff8c0a;
    color: #fff;
    transform: translateY(-1px);
  }
`;

const GhostBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: ${colors.text};
  font-weight: 600;
  font-size: 15px;
  padding: 0 20px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid #d0d0d0;
  text-decoration: none;
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: ${colors.secondary};
    color: ${colors.secondary};
  }
`;

const SecondaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: ${colors.base};
  font-weight: 700;
  font-size: 15px;
  padding: 0 22px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid ${colors.base};
  text-decoration: none;
  transition:
    background 0.2s,
    transform 0.15s;

  &:hover {
    background: ${colors.lightHighlight};
    color: ${colors.base};
    transform: translateY(-1px);
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 28px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  strong {
    display: block;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  }

  span {
    font-size: 13px;
    color: ${colors.secondary};
  }
`;

const IntroCaps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CapsEyebrow = styled.div`
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${colors.secondary};
  font-weight: 600;
`;

const CapsHeading = styled.h2`
  font-size: clamp(20px, 2.5vw, 24px);
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;

  span {
    color: ${colors.base};
  }
`;

const CapsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media ${DEVICE.tablet} {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
`;

const LoadingBox = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const BrowseLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.secondary};
  text-decoration: none;

  &:hover {
    color: ${colors.good};
  }
`;

type IntroSplitProps = {
  captions: CaptionListFields[];
  isLoading: boolean;
};

const PLACEHOLDER = "—";

export const IntroSplit = ({
  captions,
  isLoading,
}: IntroSplitProps): ReactElement => {
  const { t } = useTranslation("common");
  const { data: stats } = useHomepageStats();
  const captionsLabel = stats
    ? `${formatThousands(stats.totalCaptions)}+`
    : PLACEHOLDER;
  const languagesLabel = stats
    ? formatThousands(stats.totalLanguages)
    : PLACEHOLDER;
  const sitesLabel = stats ? formatThousands(stats.totalSites) : PLACEHOLDER;
  return (
    <Section>
      <Inner>
        <IntroCopy>
          <EyebrowPill>
            <PulseDot />
            {t("home.intro.eyebrow")}
          </EyebrowPill>

          <H1>
            <Trans i18nKey="home.intro.heading" components={{ em: <em /> }} />
          </H1>

          <Lede>
            <Trans
              i18nKey="home.intro.description"
              components={{ strong: <strong /> }}
            />
          </Lede>

          <CtaRow>
            <PrimaryBtn
              href={CHROME_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
            >
              <DownloadOutlined />
              {t("home.intro.addToChrome")}
            </PrimaryBtn>
            <SecondaryBtn
              href={FIREFOX_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
            >
              <DownloadOutlined />
              {t("home.intro.addToFirefox")}
            </SecondaryBtn>
            <GhostBtn href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GithubOutlined />
              {t("home.intro.starOnGithub")}
            </GhostBtn>
          </CtaRow>

          <StatsRow>
            <StatItem>
              <strong>{captionsLabel}</strong>
              <span>{t("home.intro.stats.captions")}</span>
            </StatItem>
            <StatItem>
              <strong>{languagesLabel}</strong>
              <span>{t("home.intro.stats.languages")}</span>
            </StatItem>
            <StatItem>
              <strong>{sitesLabel}</strong>
              <span>{t("home.intro.stats.sites")}</span>
            </StatItem>
          </StatsRow>
        </IntroCopy>

        <IntroCaps>
          <CapsEyebrow>{t("home.intro.captionsEyebrow")}</CapsEyebrow>
          <CapsHeading>
            <Trans
              i18nKey="home.intro.captionsHeading"
              components={{ span: <span /> }}
            />
          </CapsHeading>

          <CapsGrid>
            {isLoading ? (
              <LoadingBox>
                <Spin size="large" />
              </LoadingBox>
            ) : (
              captions
                .slice(0, 6)
                .map((caption) => (
                  <CaptionTile key={caption.id} caption={caption} />
                ))
            )}
          </CapsGrid>

          <Link href={routeNames.caption.browse} passHref legacyBehavior>
            <BrowseLink>
              {t("home.intro.browseAll")} <RightOutlined />
            </BrowseLink>
          </Link>
        </IntroCaps>
      </Inner>
    </Section>
  );
};
