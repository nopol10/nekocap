import { colors } from "@/common/colors";
import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { Col, Row } from "antd";
import Modal from "antd/lib/modal/Modal";
import Title from "antd/lib/typography/Title";
import { SupportedSites } from "@/common/components/supported-sites";

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
    title: "Easy to use",
    description: function description() {
      const [listOpened, setListOpened] = useState(false);
      const handleOpenList = () => {
        setListOpened(true);
      };
      const handleCloseList = () => {
        setListOpened(false);
      };
      return (
        <span>
          View captions without leaving{" "}
          <a target="_blank" rel="noreferrer" href="https://www.youtube.com">
            Youtube
          </a>{" "}
          and other supported{" "}
          <a href="#" onClick={handleOpenList}>
            video sites
          </a>
          <Modal visible={listOpened} onCancel={handleCloseList} footer={null}>
            <SupportSiteList />
          </Modal>
        </span>
      );
    },
  },
  {
    title: "Advanced effects (experimental)",
    description: function description() {
      return (
        <span>
          View complex captions made in Substation Alpha formats (SSA, ASS)
          using the advanced renderer made possible by{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/Dador/JavascriptSubtitlesOctopus"
          >
            Subtitle Octopus
          </a>
          <br />
          <a href="/fontlist">View supported custom fonts</a>
        </span>
      );
    },
  },
  {
    title: "Convenient editor",
    description: (
      <span>
        Create captions with the built-in editor directly in a video&apos;s page
        with the extension.
        <br />
        Manual caption positioning, keyboard shortcuts are supported.
        <br />
        More features to come!
      </span>
    ),
  },
  {
    title: "Import existing captions",
    description: (
      <span>
        Use tools such as Aegisub or SubtitleEdit to create captions before
        uploading them through NekoCap. <b>SSA</b>, <b>ASS</b>, <b>SRT</b>,{" "}
        <b>VTT</b>, <b>SBV</b> formats are supported
      </span>
    ),
  },
  {
    title: "Community moderation",
    description: (
      <span>
        NekoCap&apos;s website comes with tools to let community moderators
        verify or reject submitted captions.
        <br />
        However, we need volunteers who are fluent in different languages to
        help moderate submitted captions.
        <br />
        If you want to help, join the Discord and give us a ping!
      </span>
    ),
  },
];

export const FeatureList = () => {
  return (
    <Wrapper>
      <Row gutter={[16, 16]} justify="center">
        {features.map((feature, index) => {
          return (
            <FeatureItem key={index} lg={8} md={16} xs={24}>
              <div>
                <header>{feature.title}</header>
                <main>
                  {typeof feature.description !== "function" &&
                    feature.description}
                  {typeof feature.description === "function" &&
                    feature.description()}
                </main>
              </div>
            </FeatureItem>
          );
        })}
      </Row>
    </Wrapper>
  );
};
