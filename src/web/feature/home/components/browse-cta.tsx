import { colors } from "@/common/colors";
import { DEVICE } from "@/common/style-constants";
import SearchOutlined from "@ant-design/icons/SearchOutlined";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { ReactElement } from "react";
import styled from "styled-components";
import { routeNames } from "../../route-types";

const Section = styled.section`
  padding: 64px 0 96px;
  background: #fff;
`;

const Inner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;

  @media ${DEVICE.tablet} {
    padding: 0 40px;
  }
`;

const Card = styled.div`
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    ${colors.secondary} 0%,
    ${colors.good} 100%
  );
  border-radius: 16px;
  padding: 56px 48px;
  text-align: center;
  color: #fff;

  &::after {
    content: "";
    position: absolute;
    top: -80px;
    right: -60px;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      ${colors.alternate}40 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
`;

const H3 = styled.h3`
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 500;
  line-height: 1.15;
  margin: 0 0 32px;
  color: #fff;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: ${colors.good};
  font-weight: 700;
  font-size: 15px;
  padding: 0 22px;
  height: 44px;
  border-radius: 8px;
  text-decoration: none;
  transition:
    transform 0.15s,
    box-shadow 0.15s;

  &:hover {
    color: ${colors.good};
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const GhostBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  padding: 0 20px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`;

export const BrowseCTA = (): ReactElement => {
  const { t } = useTranslation("common");
  return (
    <Section id="browse">
      <Inner>
        <Card>
          <Content>
            <H3>{t("home.browseCta.heading")}</H3>
            <ButtonRow>
              <Link href={routeNames.caption.browse} passHref legacyBehavior>
                <PrimaryBtn>
                  <SearchOutlined />
                  {t("home.browseCta.primary")}
                </PrimaryBtn>
              </Link>
              {/* <Link href={routeNames.caption.browse} passHref legacyBehavior>
                <GhostBtn>
                  <TranslationOutlined />
                  {t("home.browseCta.secondary")}
                </GhostBtn>
              </Link> */}
            </ButtonRow>
          </Content>
        </Card>
      </Inner>
    </Section>
  );
};
