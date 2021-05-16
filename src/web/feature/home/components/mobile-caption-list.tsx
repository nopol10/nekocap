import { message, Typography } from "antd";
import React from "react";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import { CaptionListFields } from "@/common/feature/video/types";
import styled from "styled-components";
import { routeNames } from "../../route-types";
import { colors } from "@/common/colors";
import { languages } from "@/common/languages";
import emptyVideoImage from "@/assets/images/empty-video.jpg";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";

const { Link } = Typography;

export const MobileCaptionWrapper = styled.a`
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 20px;
`;

const MobileCaptionThumbnail = styled.img``;

const MobileTranslatedTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.white};
`;

const MobileCaptionCreator = styled.div`
  color: ${colors.white};
`;

const MobileCaptionOverlay = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0 50px 10px 8px;
  background: linear-gradient(0deg, #000000cf 0%, transparent 69%);

  header {
    margin-top: auto;
    font-size: 14px;
    color: ${colors.white};
  }
`;

export type MobileCaptionListProps = {
  captions: CaptionListFields[];
};

export const MobileCaptionList = ({ captions }: MobileCaptionListProps) => {
  return (
    <>
      {captions.map((caption) => {
        const fromLanguage = languages[caption.videoLanguage];
        const toLanguage = languages[caption.language];
        const canWatchInWebsite =
          videoSourceToProcessorMap[parseInt(caption.videoSource)]
            .canWatchInNekoCapSite;
        const url = canWatchInWebsite
          ? `${routeNames.caption.view.replace(":id", caption.id)}`
          : "#";

        const handleClickCaption = () => {
          if (!canWatchInWebsite) {
            message.warn(
              "Viewing this caption via the browser is unsupported. Download the extension instead!"
            );
          }
        };

        return (
          <MobileCaptionWrapper
            key={`mobile-caption-${caption.id}`}
            href={url}
            onClick={handleClickCaption}
          >
            <MobileCaptionOverlay>
              <header>{caption.videoName}</header>
              <MobileTranslatedTitle>
                {caption.translatedTitle}
              </MobileTranslatedTitle>
              <div>
                {fromLanguage} <CaretRightOutlined /> <b>{toLanguage}</b>
              </div>
              <MobileCaptionCreator>
                captioned by{" "}
                <b>
                  <Link
                    href={`${routeNames.profile.main.replace(
                      ":id",
                      caption.creatorId
                    )}`}
                  >
                    {caption.creatorName}
                  </Link>
                </b>
              </MobileCaptionCreator>
            </MobileCaptionOverlay>
            <MobileCaptionThumbnail
              src={caption.thumbnailUrl || emptyVideoImage}
            />
          </MobileCaptionWrapper>
        );
      })}
    </>
  );
};
