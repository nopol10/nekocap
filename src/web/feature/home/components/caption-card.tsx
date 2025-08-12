import emptyVideoImage from "@/assets/images/empty-video.jpg";
import { colors } from "@/common/colors";
import { CaptionListFields } from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { languages } from "@/common/languages";
import { getDirectCaptionLoadLink } from "@/common/processor-utils";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import PlayCircleFilled from "@ant-design/icons/PlayCircleFilled";
import UserOutlined from "@ant-design/icons/UserOutlined";
import { Button, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import React from "react";
import styled from "styled-components";
import { getTooltippedDate } from "../../common/components/data-columns";
import { routeNames } from "../../route-types";
dayjs.extend(relativeTime);

const { Link } = Typography;

const CaptionCardWrapper = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.3s;
  &:hover {
    box-shadow: 3px 4px 0px 3px ${colors.alternate};
  }
  margin-bottom: 16px;
`;

const CaptionThumbnail = styled.img`
  width: 100%;
  flex-shrink: 0;
  flex-grow: 0;
  object-fit: contain;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const CaptionThumbnailBackground = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(8px);
  transform: scale(1.1);
`;

const CaptionThumbnailContainer = styled.div`
  position: relative;
  width: 250px;
  flex-shrink: 0;
  flex-grow: 0;
  border-radius: 8px;
  overflow: hidden;
`;

const CaptionContent = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
`;

const ClickableBox = styled(Link)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const TranslatedTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SourceTag = styled.div``;

const OriginalTitle = styled.div`
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LanguageInfo = styled.div`
  font-size: 13px;
  color: ${colors.secondary};
`;

const CaptionCreator = styled.div`
  display: flex;
  gap: 6px;
  font-size: 13px;
  z-index: 10;
`;

const UploadedDate = styled.div`
  font-size: 12px;
  z-index: 10;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  flex-shrink: 0;
  z-index: 10;

  .anticon {
    font-size: 32px;
  }
`;

type CaptionCardProps = {
  caption: CaptionListFields;
};

export const CaptionCard = ({ caption }: CaptionCardProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const handleCaptionerLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (
    event,
  ) => {
    event.stopPropagation();
  };

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
  const processor = videoSourceToProcessorMap[caption.videoSource];

  const directLink = getDirectCaptionLoadLink(
    processor,
    caption.videoId,
    caption.id,
  );

  return (
    <CaptionCardWrapper>
      <ClickableBox
        href={canWatchInWebsite ? url : directLink}
        target="_blank"
        rel="noreferrer"
      />
      <CaptionThumbnailContainer>
        <CaptionThumbnailBackground
          src={caption.thumbnailUrl || emptyVideoImage.src}
        />
        <CaptionThumbnail
          src={caption.thumbnailUrl || emptyVideoImage.src}
          alt={caption.videoName}
        />
      </CaptionThumbnailContainer>
      <CaptionContent>
        <TranslatedTitle>
          {caption.translatedTitle || caption.videoName}
        </TranslatedTitle>
        {caption.translatedTitle && (
          <OriginalTitle>{caption.videoName}</OriginalTitle>
        )}
        <SourceTag>
          <Tag color={colors.secondary}>{processor?.name}</Tag>
        </SourceTag>
        <LanguageInfo>
          {fromLanguage} <CaretRightOutlined /> <b>{toLanguage}</b>
        </LanguageInfo>
        <CaptionCreator>
          <UserOutlined />
          <b>
            <Link
              onClick={handleCaptionerLinkClick}
              href={`${routeNames.profile.main.replace(
                ":id",
                caption.creatorId,
              )}`}
            >
              {caption.creatorName}
            </Link>
          </b>
        </CaptionCreator>
        <UploadedDate>
          {getTooltippedDate(caption.createdDate, router.locale)}
        </UploadedDate>
      </CaptionContent>
      {canWatchInWebsite && (
        <ActionsContainer>
          <Tooltip
            title={t("home.watchOnService", {
              service: processor.name,
            })}
          >
            <Button
              type="link"
              href={directLink}
              target="_blank"
              rel="noreferrer"
            >
              <PlayCircleFilled />
            </Button>
          </Tooltip>
        </ActionsContainer>
      )}
    </CaptionCardWrapper>
  );
};
