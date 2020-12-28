import { colors } from "@/common/colors";
import React from "react";
import styled from "styled-components";
import captionSelectImage from "@/assets/images/instructions/caption-dropdown.jpg";
import downloadExtensionImage from "@/assets/images/instructions/download-extension.jpg";
import browseVideoImage from "@/assets/images/instructions/browse-videos.jpg";
import loginToNekocapImage from "@/assets/images/instructions/login-to-nekocap.jpg";
import useEditorImage from "@/assets/images/instructions/use-editor.jpg";
import noCaptionImage from "@/assets/images/instructions/no-caption-page.jpg";
import { getImageLink } from "@/common/chrome-utils";
import { Col, Collapse, Row } from "antd";
import { CHROME_DOWNLOAD_URL } from "@/common/constants";

const Wrapper = styled.div`
  margin-bottom: 20px;
`;

const Panel = styled(Collapse.Panel)`
  .ant-collapse-header {
    font-size: 24px;
  }
`;

const StepNumber = styled.span`
  display: inline-flex;
  flex-basis: 25px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  height: 25px;
  text-align: center;
  margin-right: 10px;
  font-weight: 700;
  color: ${colors.white};
  background-color: ${colors.base};
  border-radius: 50%;
`;

const Step = styled(Col)`
  margin-top: 10px;
  img {
    width: 100%;
    max-height: 300px;
    object-fit: contain;
  }

  div {
    font-size: 16px;
    margin-bottom: 10px;
    display: flex;
  }
`;

export const Instructions = () => {
  return (
    <Wrapper>
      <Collapse defaultActiveKey={["1"]}>
        <Panel header="How to view captions" key="1">
          <Row justify={"space-around"} gutter={[10, 10]}>
            <Step>
              <div>
                <StepNumber>1</StepNumber>
                <span>
                  Download the extension for{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={CHROME_DOWNLOAD_URL}
                  >
                    Chrome
                  </a>
                </span>
              </div>
              <img src={getImageLink(downloadExtensionImage)} />
            </Step>
            <Step>
              <div>
                <StepNumber>2</StepNumber>
                <span>
                  Watch videos on one of the supported video sites as usual
                </span>
              </div>
              <img src={getImageLink(browseVideoImage)} />
            </Step>
            <Step>
              <div>
                <StepNumber>3</StepNumber>
                <span>
                  If there are captions for the video, select them from the
                  dropdown!
                </span>
              </div>
              <img src={getImageLink(captionSelectImage)} />
            </Step>
          </Row>
        </Panel>
        <Panel header="How to create captions" key="2">
          <Row justify={"space-around"} gutter={[10, 10]}>
            <Step>
              <div>
                <StepNumber>1</StepNumber>
                <span>
                  Download the extension for{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={CHROME_DOWNLOAD_URL}
                  >
                    Chrome
                  </a>
                </span>
              </div>
              <img src={getImageLink(downloadExtensionImage)} />
            </Step>
            <Step>
              <div>
                <StepNumber>2</StepNumber>
                <span>Create an account with Nekocap</span>
              </div>
              <img src={getImageLink(loginToNekocapImage)} />
            </Step>
            <Step>
              <div>
                <StepNumber>3</StepNumber>{" "}
                <span>
                  Browse to the page containing the video you want to add a
                  caption for
                </span>
              </div>
              <img src={getImageLink(noCaptionImage)} />
            </Step>
            <Step>
              <div>
                <StepNumber>4</StepNumber>
                <span>
                  Use the Nekocap editor to create a new caption or upload an
                  existing caption file without leaving the video page!
                </span>
              </div>
              <img src={getImageLink(useEditorImage)} />
            </Step>
          </Row>
        </Panel>
      </Collapse>
    </Wrapper>
  );
};
