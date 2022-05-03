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

export const MobileCaptionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 20px;
`;

const MobileCaptionThumbnail = styled.img``;

const MobileTranslatedTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: ${colors.white};
`;

const LanguageLabel = styled.div`
  font-size: 12px;
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
  backdrop-filter: blur(6px) brightness(0.7);

  header {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: auto;
    font-size: 12px;
    color: ${colors.white};
  }
`;

export type MobileCaptionListProps = {
  captions: CaptionListFields[];
};

export const MobileCaptionList = ({ captions }: MobileCaptionListProps) => {
  const handleCaptionerLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (
    event
  ) => {
    event.stopPropagation();
  };
  return (
    <div>
      {captions.map((caption) => {
        if (!caption) {
          return null;
        }
        const fromLanguage = languages[caption.videoLanguage];
        const toLanguage = languages[caption.language];
        const canWatchInWebsite =
          videoSourceToProcessorMap[parseInt(caption.videoSource)]
            ?.canWatchInNekoCapSite || false;
        const url = canWatchInWebsite
          ? `${routeNames.caption.view.replace(":id", caption.id)}`
          : "#";

        const handleClickCaption = () => {
          if (!canWatchInWebsite) {
            message.warn(
              "Viewing this caption via the browser is unsupported. Download the extension instead!"
            );
            return;
          }
          window.open(url, "_blank");
        };

        return (
          <MobileCaptionWrapper
            key={`mobile-caption-${caption.id}`}
            onClick={handleClickCaption}
          >
            <MobileCaptionOverlay>
              <header>{caption.videoName}</header>
              <MobileTranslatedTitle>
                {caption.translatedTitle}
              </MobileTranslatedTitle>
              <LanguageLabel>
                {fromLanguage} <CaretRightOutlined /> <b>{toLanguage}</b>
              </LanguageLabel>
              <MobileCaptionCreator>
                captioned by{" "}
                <b>
                  <Link
                    onClick={handleCaptionerLinkClick}
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
              src={caption.thumbnailUrl || emptyVideoImage.src}
            />
          </MobileCaptionWrapper>
        );
      })}
    </div>
  );
};
