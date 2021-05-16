import React from "react";
import { colors } from "@/common/colors";
import Layout from "antd/lib/layout";
import { message, Space, Tooltip, Typography } from "antd";
import {
  CaptionerFields,
  CaptionerPrivateFields,
} from "@/common/feature/captioner/types";
import EditOutlined from "@ant-design/icons/EditOutlined";
import CopyOutlined from "@ant-design/icons/CopyOutlined";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faUserCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { CaptionList } from "../../common/components/caption-list";
import { CaptionListFields } from "@/common/feature/video/types";
import { EditProfileFields } from "@/common/feature/profile/types";
import styled from "styled-components";
import { ProfileSidebar } from "./profile-sidebar";
import { DEVICE } from "@/common/style-constants";
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
  onChangePage?: (page: number, pageSize?: number) => void;
  onDelete?: (caption: CaptionListFields) => void;
  onSetEditing?: (isEditing: boolean) => void;
  onSubmitEdit?: (form: EditProfileFields) => void;
  onCancelEdit?: () => void;
  onAssignReviewerManager: () => void;
  onAssignReviewer: () => void;
  onVerifyCaptioner: () => void;
  onBanCaptioner: () => void;
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
}: ProfileProps) => {
  const {
    captionCount,
    userId: captionerId,
    name,
    nameTag,
    verified,
    banned,
    isReviewer: isProfileReviewer,
    isReviewerManager: isProfileReviewerManager,
  } = captioner;

  const isOwnProfile = !!privateData;

  const handleCopyProfileLink = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.protocol + "//" + window.location.hostname}/capper/${
          loggedInUser.userId
        }`
      );
    }
    message.info("Profile link copied to clipboard!");
  };

  return (
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <Layout style={{ height: "100%" }}>
        <ProfileHeader style={{ textAlign: "left", paddingLeft: "20px" }}>
          <div>
            <Username>
              {isLoading && <span>Loading...</span>}
              {!isLoading && (
                <>
                  {name}
                  <em style={{ marginRight: "10px" }}>#{nameTag}</em>
                </>
              )}
              <Space>
                {!isEditing && canEdit && (
                  <Tooltip title={"Edit"}>
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
                  <Tooltip title="Banned">
                    <FontAwesomeIcon
                      icon={faBan}
                      color={colors.dislike}
                      style={{ fontSize: "0.5em", marginLeft: "10px" }}
                    />
                  </Tooltip>
                )}
                {!banned && verified && (
                  <Tooltip title="Verified">
                    <FontAwesomeIcon
                      icon={faCheck}
                      color={colors.like}
                      style={{ fontSize: "0.5em", marginLeft: "10px" }}
                    />
                  </Tooltip>
                )}
                {isProfileReviewerManager && (
                  <Tooltip title="Reviewer Manager">
                    <FontAwesomeIcon
                      icon={faUsers}
                      color={colors.like}
                      style={{ fontSize: "0.5em" }}
                    />
                  </Tooltip>
                )}
                {isProfileReviewer && (
                  <Tooltip title="Reviewer">
                    <FontAwesomeIcon
                      icon={faUserCheck}
                      color={colors.like}
                      style={{ fontSize: "0.5em" }}
                    />
                  </Tooltip>
                )}
                {isOwnProfile && (
                  <Tooltip title="Copy profile link">
                    <CopyOutlined
                      style={{ fontSize: "20px" }}
                      onClick={handleCopyProfileLink}
                    />
                  </Tooltip>
                )}
              </Space>
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
            <Content>
              <div style={{ padding: "40px 40px" }}>
                <Title level={3}>Contributed captions</Title>
                <CaptionList
                  loggedInUser={loggedInUser}
                  captions={captions}
                  totalCount={captionCount}
                  captionerId={captionerId}
                  isLoadingCaptionPage={isLoadingCaptionPage}
                  currentPage={currentCaptionPage}
                  onChangePage={onChangePage}
                  onDelete={onDelete}
                  listContainsCurrentPageOnly={true}
                />
              </div>
            </Content>
          </ProfileLayout>
        </Content>
      </Layout>
    </div>
  );
};
