import browseVideoImage from "@/assets/images/instructions/browse-videos.jpg";
import captionSelectImage from "@/assets/images/instructions/caption-dropdown.jpg";
import downloadExtensionImage from "@/assets/images/instructions/download-extension.jpg";
import loginToNekocapImage from "@/assets/images/instructions/login-to-nekocap.jpg";
import noCaptionImage from "@/assets/images/instructions/no-caption-page.jpg";
import useEditorImage from "@/assets/images/instructions/use-editor.jpg";
import { getImageLink } from "@/common/chrome-utils";
import { colors } from "@/common/colors";
import { CHROME_DOWNLOAD_URL } from "@/common/constants";
import { Col, Collapse, CollapseProps, Row } from "antd";
import { Trans, useTranslation } from "next-i18next";
import Image from "next/image";
import { ReactElement } from "react";
import styled from "styled-components";

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

export const Instructions = (): ReactElement => {
  const { t } = useTranslation("common");
  const instructionItems: CollapseProps["items"] = [
    {
      key: "1",
      label: t("home.instructions.view.title"),
      children: (
        <Row justify={"space-around"} gutter={[10, 10]}>
          <Step>
            <div>
              <StepNumber>1</StepNumber>
              <span>
                <Trans
                  i18nKey={"home.instructions.view.step1"}
                  components={{
                    chrome: (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={CHROME_DOWNLOAD_URL}
                      />
                    ),
                  }}
                ></Trans>
              </span>
            </div>
            <Image
              src={getImageLink(downloadExtensionImage)}
              width={575}
              height={350}
              alt={t("home.instructions.view.step1")}
            />
          </Step>
          <Step>
            <div>
              <StepNumber>2</StepNumber>
              <span>{t("home.instructions.view.step2")}</span>
            </div>
            <Image
              src={getImageLink(browseVideoImage)}
              width={575}
              height={350}
              alt={t("home.instructions.view.step2")}
            />
          </Step>
          <Step>
            <div>
              <StepNumber>3</StepNumber>
              <span>{t("home.instructions.view.step3")}</span>
            </div>
            <Image
              src={getImageLink(captionSelectImage)}
              width={575}
              height={350}
              alt={t("home.instructions.view.step3")}
            />
          </Step>
        </Row>
      ),
    },
    {
      key: "2",
      label: t("home.instructions.create.title"),
      children: (
        <Row justify={"space-around"} gutter={[10, 10]}>
          <Step>
            <div>
              <StepNumber>1</StepNumber>
              <span>
                <Trans
                  i18nKey={"home.instructions.create.step1"}
                  components={{
                    chrome: (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={CHROME_DOWNLOAD_URL}
                      />
                    ),
                  }}
                ></Trans>
              </span>
            </div>
            <Image
              src={getImageLink(downloadExtensionImage)}
              width={575}
              height={350}
              alt={t("home.instructions.create.step1")}
            />
          </Step>
          <Step>
            <div>
              <StepNumber>2</StepNumber>
              <span>{t("home.instructions.create.step2")}</span>
            </div>
            <Image
              src={getImageLink(loginToNekocapImage)}
              width={575}
              height={350}
              alt={t("home.instructions.create.step2")}
            />
          </Step>
          <Step>
            <div>
              <StepNumber>3</StepNumber>{" "}
              <span>{t("home.instructions.create.step3")}</span>
            </div>
            <Image
              src={getImageLink(noCaptionImage)}
              width={575}
              height={350}
              alt={t("home.instructions.create.step3")}
            />
          </Step>
          <Step>
            <div>
              <StepNumber>4</StepNumber>
              <span>{t("home.instructions.create.step4")}</span>
            </div>
            <Image
              src={getImageLink(useEditorImage)}
              width={575}
              height={350}
              alt={t("home.instructions.create.step4")}
            />
          </Step>
        </Row>
      ),
    },
  ];

  return (
    <Wrapper>
      <Collapse defaultActiveKey={["1"]} items={instructionItems} />
    </Wrapper>
  );
};
