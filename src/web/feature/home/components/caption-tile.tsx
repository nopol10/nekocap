import emptyVideoImage from "@/assets/images/empty-video.jpg";
import { colors } from "@/common/colors";
import { CaptionListFields } from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { languages } from "@/common/languages";
import { getDirectCaptionLoadLink } from "@/common/processor-utils";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import PlayCircleFilled from "@ant-design/icons/PlayCircleFilled";
import UserOutlined from "@ant-design/icons/UserOutlined";
import { Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "next-i18next";
import React from "react";
import styled from "styled-components";
import { routeNames } from "../../route-types";

dayjs.extend(relativeTime);

const { Link } = Typography;

const TileWrapper = styled.div`
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: box-shadow 0.2s;
  background: #fff;
  &:hover {
    box-shadow: 3px 4px 0px 3px ${colors.alternate};
  }
  &:hover .play-overlay {
    opacity: 1;
  }
`;

const ThumbArea = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #e9e9e9;
  overflow: hidden;
`;

const BgImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(14px) brightness(0.7);
  transform: scale(1.2);
`;

const FrontImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  background: rgba(0, 0, 0, 0.3);
  font-size: 36px;
  color: #fff;
`;

const SrcTag = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
`;

const FeatTagsRow = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
`;

const FeatTag = styled.div`
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
`;

const Body = styled.div`
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${colors.text};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
`;

const OrigTitle = styled.div`
  font-size: 12px;
  color: ${colors.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LangRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
`;

const FromLang = styled.span`
  color: ${colors.secondary};
`;

const ToLang = styled.span`
  color: ${colors.good};
  font-weight: 600;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${colors.secondary};
`;

const Dot = styled.span`
  color: #ccc;
`;

const ClickableBox = styled.a`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const SourceLink = styled.a`
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 18px;
  text-decoration: none;
  transition:
    background 0.15s,
    transform 0.15s;

  &:hover {
    background: ${colors.base};
    color: #fff;
    transform: scale(1.08);
  }
`;

const CreatorLink = styled(Link)`
  font-size: 12px;
  color: ${colors.text} !important;
  z-index: 2;
  position: relative;
`;

type CaptionTileProps = {
  caption: CaptionListFields;
};

export const CaptionTile = ({ caption }: CaptionTileProps) => {
  const { t } = useTranslation("common");
  if (!caption) return null;

  const fromLanguage =
    languages[caption.videoLanguage] || caption.videoLanguage;
  const toLanguage = languages[caption.language] || caption.language;

  const processor = videoSourceToProcessorMap[parseInt(caption.videoSource)];
  const canWatchInWebsite = processor?.canWatchInNekoCapSite || false;

  const viewUrl = canWatchInWebsite
    ? routeNames.caption.view.replace(":id", caption.id)
    : undefined;

  const directLink = processor
    ? getDirectCaptionLoadLink(processor, caption.videoId, caption.id)
    : "#";

  const href = canWatchInWebsite ? viewUrl : directLink;

  const featTags: string[] = [];
  if (caption.advanced) featTags.push("SSA");
  if (caption.tags?.includes("audioDescribed")) featTags.push("AD");
  if (caption.tags?.includes("ytExCC")) featTags.push("CC+");

  const thumbSrc = caption.thumbnailUrl || emptyVideoImage.src;

  return (
    <TileWrapper>
      <ClickableBox href={href} target="_blank" rel="noreferrer" />
      <ThumbArea>
        <BgImg src={thumbSrc} aria-hidden="true" />
        <FrontImg src={thumbSrc} alt={caption.videoName} />
        <PlayOverlay className="play-overlay">▶</PlayOverlay>
        {processor?.name && <SrcTag>{processor.name}</SrcTag>}
        {featTags.length > 0 && (
          <FeatTagsRow>
            {featTags.map((tag) => (
              <FeatTag key={tag}>{tag}</FeatTag>
            ))}
          </FeatTagsRow>
        )}
        {canWatchInWebsite && processor && (
          <Tooltip
            title={t("home.watchOnService", { service: processor.name })}
          >
            <SourceLink
              href={directLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={t("home.watchOnService", { service: processor.name })}
            >
              <PlayCircleFilled />
            </SourceLink>
          </Tooltip>
        )}
      </ThumbArea>
      <Body>
        <Title>{caption.translatedTitle || caption.videoName}</Title>
        {caption.translatedTitle && <OrigTitle>{caption.videoName}</OrigTitle>}
        <LangRow>
          <FromLang>{fromLanguage}</FromLang>
          <CaretRightOutlined style={{ fontSize: 10, color: "#ccc" }} />
          <ToLang>{toLanguage}</ToLang>
        </LangRow>
        <MetaRow>
          <UserOutlined />
          <CreatorLink
            href={routeNames.profile.main.replace(":id", caption.creatorId)}
            onClick={(e) => e.stopPropagation()}
          >
            {caption.creatorName}
          </CreatorLink>
          <Dot>·</Dot>
          <span>{dayjs.unix(caption.createdDate).fromNow()}</span>
        </MetaRow>
      </Body>
    </TileWrapper>
  );
};
