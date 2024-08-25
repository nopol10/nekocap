import { colors } from "@/common/colors";
import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { Col, Row } from "antd";
import Modal from "antd/lib/modal/Modal";
import Title from "antd/lib/typography/Title";
import { SupportedSites } from "@/common/components/supported-sites";
import { Trans, useTranslation } from "next-i18next";
import { Translation } from "react-i18next";
import Link from "next/link";

const Wrapper = styled.div`
  margin-bottom: 20px;
`;

const FeatureItem = styled(Col)`
  & > div {
    height: 100%;
    padding: 20px;
    border: 1px solid ${colors.divider};
    background-color: ${colors.white};

    header {
      font-size: 18px;
      font-weight: bold;
    }
    main {
      font-size: 16px;
    }
  }
`;

type Feature = {
  title?: string;
  description: string | ReactNode | React.FunctionComponent;
};

const getSearchableFontName = (fontName: string) => {
  return fontName.replace(/ (Bold|Semibold|Light)/g, "").toLowerCase();
};

const SupportSiteList = () => {
  return (
    <div>
      <Title level={3}>Supported sites</Title>
      <SupportedSites />
    </div>
  );
};

const features: Feature[] = [
  {
    title: "home.feature.easyToUse.title",
    description: function Description() {
      const [listOpened, setListOpened] = useState(false);
      const handleOpenList = () => {
        setListOpened(true);
      };
      const handleCloseList = () => {
        setListOpened(false);
      };
      return (
        <span>
          <Trans
            i18nKey={"home.feature.easyToUse.description"}
            components={{
              youtube: (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://www.youtube.com"
                />
              ),
              videosites: <a href="#" onClick={handleOpenList} />,
            }}
          ></Trans>
          <Modal open={listOpened} onCancel={handleCloseList} footer={null}>
            <SupportSiteList />
          </Modal>
        </span>
      );
    },
  },
  {
    title: "home.feature.advancedEffects.title",
    description: function description() {
      return (
        <span>
          <Trans
            i18nKey={"home.feature.advancedEffects.description"}
            components={{
              octopus: (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://github.com/Dador/JavascriptSubtitlesOctopus"
                />
              ),
            }}
          ></Trans>
          <br />
          <Link href="/fontlist">
            <Translation>
              {(t) => t("home.feature.advancedEffects.viewSupportedFonts")}
            </Translation>
          </Link>
        </span>
      );
    },
  },
  {
    title: "home.feature.convenientEditor.title",
    description: (
      <span>
        <Trans i18nKey={"home.feature.convenientEditor.description"} />
      </span>
    ),
  },
  {
    title: "home.feature.import.title",
    description: (
      <span>
        <Trans
          i18nKey={"home.feature.import.description"}
          components={{ bold: <b /> }}
        />
      </span>
    ),
  },
  {
    title: "home.feature.community.title",
    description: (
      <span>
        <Trans i18nKey={"home.feature.community.description"} />
      </span>
    ),
  },
];

export const FeatureList = () => {
  const { t } = useTranslation("common");
  return (
    <Wrapper>
      <Row gutter={[16, 16]} justify="center">
        {features.map((feature, index) => {
          return (
            <FeatureItem key={index} lg={8} md={16} xs={24}>
              <div>
                <header>{t(feature.title || "")}</header>
                <main>
                  {typeof feature.description !== "function" &&
                    feature.description}
                  {typeof feature.description === "function" &&
                    feature.description({})}
                </main>
              </div>
            </FeatureItem>
          );
        })}
      </Row>
    </Wrapper>
  );
};
