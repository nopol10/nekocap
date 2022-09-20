import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { colors } from "@/common/colors";
import Layout from "antd/lib/layout";
import { message, Select, Space, Tag, Tooltip, Typography } from "antd";
import {
  CaptionerFields,
  CaptionerPrivateFields,
} from "@/common/feature/captioner/types";
import EditOutlined from "@ant-design/icons/EditOutlined";
import CopyOutlined from "@ant-design/icons/CopyOutlined";
import SettingOutlined from "@ant-design/icons/SettingOutlined";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faUserCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  CaptionList,
  CAPTION_LIST_PAGE_SIZE,
} from "../../common/components/caption-list";
import { CaptionListFields } from "@/common/feature/video/types";
import { EditProfileFields } from "@/common/feature/profile/types";
import styled from "styled-components";
import { ProfileSidebar } from "./profile-sidebar";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { DEVICE } from "@/common/style-constants";
import {
  getCaptionGroupTagName,
  getCaptionTagFromTagString,
} from "@/common/feature/video/utils";
import { MAX_SEARCH_TAG_LIMIT } from "@/common/feature/video/constants";
import { useIsClient } from "@/hooks";
import { routeNames } from "../../route-types";

const { Title } = Typography;
const { Content, Header } = Layout;

const ProfileHeader = styled(Header)`
  &.ant-layout-header {
    background-color: ${colors.white};
    height: unset;
    line-height: unset;
    .ant-space-horizontal,
    .ant-space-item {
      height: unset;
    }
    @media ${DEVICE.tablet} {
      height: 64px;
      line-height: 64px;
    }
  }
`;

const Username = styled.div`
  display: flex;
  align-items: baseline;
  font-size: 2em;
  font-weight: 600;
  background-color: ${colors.white};
  padding-top: 20px;

  @media ${DEVICE.tablet} {
    padding-top: 0px;
    font-size: 3em;
  }

  em {
    font-weight: 400;
    font-size: 0.6em;
  }

  .anticon {
    font-size: 0.5em;
  }
`;

const ProfileLayout = styled(Layout)`
  &.ant-layout.ant-layout-has-sider {
    flex-direction: column;
    @media ${DEVICE.tablet} {
      flex-direction: row;
    }
  }
`;

export const EMPTY_PROFILE: CaptionerFields = {
  donationLink: "",
  languageCodes: [],
  name: "",
  nameTag: 0,
  profileMessage: "",
  recs: 0,
  captionCount: 0,
  userId: "",
  verified: false,
  banned: false,
  lastSubmissionTime: 0,
  isAdmin: false,
  isReviewer: false,
  isReviewerManager: false,
};

type ProfileProps = {
  currentCaptionPage: number;
  loggedInUser?: CaptionerFields;
  privateData?: CaptionerPrivateFields;
  captions: CaptionListFields[];
  captioner?: CaptionerFields;
  isLoading?: boolean;
  isLoadingCaptionPage?: boolean;
  isEditing?: boolean;
  canEdit?: boolean;
  hasMore: boolean; // has more captions to load
  onChangePage?: (page: number, pageSize?: number, tags?: string[]) => void;
  onDelete?: (caption: CaptionListFields) => void;
  onSetEditing?: (isEditing: boolean) => void;
  onSubmitEdit?: (form: EditProfileFields) => void;
  onCancelEdit?: () => void;
  onAssignReviewerManager: () => void;
  onAssignReviewer: () => void;
  onVerifyCaptioner: () => void;
  onBanCaptioner: () => void;
  onSetFilteredTags: (tags: string[]) => void;
  onUpdateCaption: (captionId: string) => void;
};

export const Profile = ({
  loggedInUser = EMPTY_PROFILE,
  privateData,
  onChangePage,
  onDelete,
  currentCaptionPage: currentCaptionPage,
  captions,
  captioner = EMPTY_PROFILE,
  isLoading,
  isLoadingCaptionPage,
  isEditing,
  canEdit,
  hasMore,
  onSetEditing = () => {
    /*do nothing*/
  },
  onSubmitEdit = () => {
    /*do nothing*/
  },
  onCancelEdit = () => {
    /*do nothing*/
  },
  onAssignReviewerManager = () => {
    /*do nothing*/
  },
  onAssignReviewer = () => {
    /*do nothing*/
  },
  onVerifyCaptioner = () => {
    /*do nothing*/
  },
  onBanCaptioner = () => {
    /*do nothing*/
  },
  onSetFilteredTags,
  onUpdateCaption,
}: ProfileProps): ReactElement => {
  const { t } = useTranslation("common");
  const {
    captionCount,
    userId: captionerId,
    name,
    nameTag,
    verified,
    banned,
    isReviewer: isProfileReviewer,
    isReviewerManager: isProfileReviewerManager,
    captionTags = [],
  } = captioner;

  const isOwnProfile = !!privateData;

  const existingTags = useMemo(() => {
    return captionTags
      .map((tag) => ({ ...getCaptionTagFromTagString(tag), tag }))
      .filter(Boolean);
  }, [captionTags]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const router = useRouter();
  const hasPerformedInitialFilter = useRef(false);
  const inClient = useIsClient();

  useEffect(() => {
    if (existingTags.length <= 0 || hasPerformedInitialFilter.current) {
      return;
    }
    hasPerformedInitialFilter.current = true;
    let defaultFilterTagNames = router.query.tags || "";
    if (!defaultFilterTagNames) {
      return;
    }
    if (typeof defaultFilterTagNames === "string") {
      defaultFilterTagNames = [defaultFilterTagNames];
    }
    const defaultTags = existingTags
      .filter((tag) => {
        return defaultFilterTagNames.includes(tag.name);
      })
      .map((tag) => tag.tag);
    if (defaultTags.length > 0) {
      handleChangeTagFilter(defaultTags);
    }
  }, [existingTags]);

  const filteredCount =
    captions.length +
    (currentCaptionPage - 1) * CAPTION_LIST_PAGE_SIZE +
    (hasMore ? 1 : 0);

  const currentCaptionListCount =
    selectedTags.length > 0 ? filteredCount : captionCount;

  const handleCopyProfileLink = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.protocol + "//" + window.location.hostname}/capper/${
          loggedInUser.userId
        }`
      );
    }
    message.info(t("profile.profileLinkCopiedMessage"));
  };

  const handleClickSettings = () => {
    router.push(routeNames.captioner.settings);
  };

  const handleChangeTagFilter = (tags: string[]) => {
    setSelectedTags(tags);
    onSetFilteredTags(tags);
    const newUrl = new URL(window.location.href);
    newUrl.search = "";
    if (tags.length > 0) {
      tags.map((tag) => {
        newUrl.searchParams.append("tags", getCaptionGroupTagName(tag));
      });
    }
    window.history.pushState({}, document.title, newUrl);
  };

  const handleOnChangePage = (page: number, pageSize: number) => {
    onChangePage(page, pageSize, selectedTags);
  };

  return (
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <Layout style={{ height: "100%" }}>
        <ProfileHeader style={{ textAlign: "left", paddingLeft: "20px" }}>
          <div>
            <Username>
              {isLoading && <span>{t("common.loading")}</span>}
              {!isLoading && (
                <>
                  {name}
                  <em style={{ marginRight: "10px" }}>#{nameTag}</em>
                </>
              )}
              <Space>
                {!isEditing && canEdit && (
                  <Tooltip title={t("common.edit")}>
                    <EditOutlined
                      onClick={() => onSetEditing(true)}
                      style={{
                        fontSize: "0.5em",
                        color: colors.good,
                      }}
                    />
                  </Tooltip>
                )}
                {banned && (
                  <Tooltip title={t("common.banned")}>
                    <FontAwesomeIcon
                      icon={faBan}
                      color={colors.dislike}
                      style={{ fontSize: "0.5em", marginLeft: "10px" }}
                    />
                  </Tooltip>
                )}
                {!banned && verified && (
                  <Tooltip title={t("common.verified")}>
                    <FontAwesomeIcon
                      icon={faCheck}
                      color={colors.like}
                      style={{ fontSize: "0.5em", marginLeft: "10px" }}
                    />
                  </Tooltip>
                )}
                {isProfileReviewerManager && (
                  <Tooltip title={t("common.reviewerManager")}>
                    <FontAwesomeIcon
                      icon={faUsers}
                      color={colors.like}
                      style={{ fontSize: "0.5em" }}
                    />
                  </Tooltip>
                )}
                {isProfileReviewer && (
                  <Tooltip title={t("common.reviewer")}>
                    <FontAwesomeIcon
                      icon={faUserCheck}
                      color={colors.like}
                      style={{ fontSize: "0.5em" }}
                    />
                  </Tooltip>
                )}
                {isOwnProfile && (
                  <Tooltip title={t("profile.copyProfileLink")}>
                    <CopyOutlined onClick={handleCopyProfileLink} />
                  </Tooltip>
                )}
              </Space>
              {isOwnProfile && (
                <SettingOutlined
                  style={{ marginLeft: "auto", fontSize: "18px" }}
                  onClick={handleClickSettings}
                />
              )}
            </Username>
          </div>
        </ProfileHeader>
        <Content style={{ display: "flex", flexDirection: "column" }}>
          <ProfileLayout style={{ height: "100%" }}>
            <ProfileSidebar
              captioner={captioner}
              loggedInUser={loggedInUser}
              privateData={privateData}
              isLoading={isLoading}
              isEditing={isEditing}
              onAssignReviewerManager={onAssignReviewerManager}
              onAssignReviewer={onAssignReviewer}
              onVerifyCaptioner={onVerifyCaptioner}
              onBanCaptioner={onBanCaptioner}
              onSubmit={onSubmitEdit}
              onCancel={onCancelEdit}
            />
            <Content style={{ width: "auto" }}>
              <div style={{ padding: "40px 40px" }}>
                <Title level={3}>{t("profile.contributedCaptions")}</Title>
                {/* do a client check to prevent ssr issues */}
                {inClient && (
                  <Select
                    mode="multiple"
                    maxTagCount={5}
                    showSearch
                    showArrow
                    placeholder={t("profile.filterByTags", {
                      maxTags: MAX_SEARCH_TAG_LIMIT,
                    })}
                    value={selectedTags}
                    style={{ width: "100%", marginBottom: 6 }}
                    onChange={handleChangeTagFilter}
                    notFoundContent={t("profile.noTags")}
                  >
                    {existingTags.map((tag) => {
                      return (
                        <Select.Option
                          key={tag.name}
                          value={tag.tag}
                          label={tag.name}
                          disabled={
                            selectedTags.length >= MAX_SEARCH_TAG_LIMIT &&
                            !selectedTags.includes(tag.tag)
                          }
                        >
                          <Tag color={tag.color}>{tag.name}</Tag>
                        </Select.Option>
                      );
                    })}
                  </Select>
                )}

                <CaptionList
                  loggedInUser={loggedInUser}
                  captions={captions}
                  totalCount={currentCaptionListCount}
                  captionerId={captionerId}
                  isLoadingCaptionPage={isLoadingCaptionPage}
                  currentPage={currentCaptionPage}
                  onChangePage={handleOnChangePage}
                  onDelete={onDelete}
                  listContainsCurrentPageOnly={true}
                  onUpdateCaption={onUpdateCaption}
                  onSelectTag={handleChangeTagFilter}
                />
              </div>
            </Content>
          </ProfileLayout>
        </Content>
      </Layout>
    </div>
  );
};
