import React, { ReactElement } from "react";
import styled from "styled-components";
import { colors } from "@/common/colors";
import Layout from "antd/lib/layout";
import { Button, Input, Select, Skeleton, Space, Typography } from "antd";
import {
  CaptionerFields,
  CaptionerPrivateFields,
} from "@/common/feature/captioner/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandHoldingUsd } from "@fortawesome/free-solid-svg-icons";
import Form from "antd/lib/form/Form";
import { Controller, useForm } from "react-hook-form";
import { EditProfileFields } from "@/common/feature/profile/types";
import { WSButton } from "@/common/components/ws-button";
import { WSMarkdown } from "@/common/components/ws-markdown";
import { languageOptions } from "@/common/language-utils";
import { languages } from "@/common/languages";
import { DEVICE } from "@/common/style-constants";
import { useSSRMediaQuery } from "@/hooks";
import { useTranslation } from "next-i18next";

const { Title, Text, Link } = Typography;
const { Sider } = Layout;
const { TextArea } = Input;

const ProfileSider = styled(Sider)`
  &.ant-layout-sider {
    padding: 0 20px 20px;
    background-color: ${colors.white};
  }
  .ant-layout-sider-children {
    border-top: 1px ${colors.divider} solid;
    padding-top: 10px;
  }
`;

const ProfileMessage = styled(Text)`
  display: inline-block;
  margin-bottom: 20px;
`;

const ProfileField = styled.div`
  margin-bottom: 10px;
`;

export const ProfileSidebar = ({
  captioner,
  loggedInUser,
  isEditing,
  isLoading,
  onSubmit,
  onCancel,
  onAssignReviewerManager,
  onAssignReviewer,
  onVerifyCaptioner,
  onBanCaptioner,
}: {
  captioner: CaptionerFields; // The user that is being viewed
  privateData?: CaptionerPrivateFields; // The private data of the user being viewed
  loggedInUser?: CaptionerFields; // The logged in user that's viewing this profile
  isLoading: boolean;
  isEditing: boolean;
  onSubmit?: (form: EditProfileFields) => void;
  onCancel?: () => void;
  onAssignReviewerManager: () => void;
  onAssignReviewer: () => void;
  onVerifyCaptioner: () => void;
  onBanCaptioner: () => void;
}): ReactElement => {
  const { handleSubmit, control } = useForm<EditProfileFields>();
  const {
    profileMessage,
    donationLink,
    languageCodes,
    isReviewerManager: isProfileUserReviewerManager,
    isReviewer: isProfileUserReviewer,
  } = captioner;

  const isReviewerManager = loggedInUser
    ? loggedInUser.isReviewerManager
    : false;
  const isAdmin = loggedInUser ? loggedInUser.isAdmin : false;
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });
  const { t } = useTranslation("common");

  const renderAdminBar = () => {
    if (!isReviewerManager && !isAdmin) {
      return null;
    }
    if (isLoading) {
      return null;
    }
    const canAssignReviewerManager = isAdmin;
    const canVerify = isAdmin;
    const canBan = isAdmin;
    const canAssignReviewer = isAdmin || isReviewerManager;

    return (
      <>
        <Title level={4}>{t("profile.admin.sectionTitle")}</Title>
        <Space direction={"vertical"}>
          {canAssignReviewerManager && (
            <div>
              <Button onClick={onAssignReviewerManager}>
                {isProfileUserReviewerManager
                  ? t("profile.admin.removeReviewerManagerRoleButton")
                  : t("profile.admin.assignReviewerManagerRoleButton")}
              </Button>
            </div>
          )}
          {canAssignReviewer && !isProfileUserReviewerManager && (
            <div>
              <Button onClick={onAssignReviewer}>
                {isProfileUserReviewer
                  ? t("profile.admin.removeReviewerRoleButton")
                  : t("profile.admin.assignReviewerRoleButton")}
              </Button>
            </div>
          )}
          {canVerify && (
            <div>
              <Button onClick={onVerifyCaptioner}>
                {captioner.verified
                  ? t("profile.admin.unverify")
                  : t("profile.admin.verify")}
              </Button>
            </div>
          )}
          {canBan && (
            <div>
              <Button onClick={onBanCaptioner}>
                {captioner.banned
                  ? t("profile.admin.unban")
                  : t("profile.admin.ban")}
              </Button>
            </div>
          )}
        </Space>
      </>
    );
  };

  return (
    <Form onFinish={handleSubmit(onSubmit)} style={{ display: "flex" }}>
      <ProfileSider width={isDesktop ? "420px" : "100%"}>
        <Skeleton loading={isLoading}>
          <ProfileField>
            <Title level={3}>
              {t("profile.about")}{" "}
              {isEditing && (
                <Text style={{ fontSize: "0.5em" }}>
                  <Link
                    href="https://www.markdownguide.org/cheat-sheet/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("profile.markdownInfo")}
                  </Link>
                </Text>
              )}
            </Title>
            {!isEditing && (
              <ProfileMessage>
                <WSMarkdown source={profileMessage} />
              </ProfileMessage>
            )}
            {isEditing && (
              <>
                <Controller
                  name={"profileMessage"}
                  as={TextArea}
                  control={control}
                  defaultValue={profileMessage}
                  style={{ height: "400px" }}
                />
              </>
            )}
          </ProfileField>
          <ProfileField>
            {(isEditing ||
              (!isEditing && languageCodes && languageCodes.length > 0)) && (
              <Title level={3}>{t("profile.proficientLanguages")}</Title>
            )}
            {!isEditing && (
              <ul>
                {languageCodes.map((languageCode) => {
                  return <li key={languageCode}>{languages[languageCode]}</li>;
                })}
              </ul>
            )}
            {isEditing && (
              <Controller
                as={Select}
                name={"languageCodes"}
                control={control}
                mode={"multiple"}
                showSearch
                size={"large"}
                style={{ width: "100%" }}
                placeholder={t("profile.languageSelectionPlaceholder")}
                defaultValue={languageCodes}
                disabled={!isEditing}
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0 ||
                  option.props.value
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                rules={{ required: true, minLength: 1 }}
              >
                {languageOptions}
              </Controller>
            )}
          </ProfileField>

          <ProfileField>
            {(isEditing || (!isEditing && donationLink)) && (
              <Title level={3}>
                {t("profile.donate")}{" "}
                <FontAwesomeIcon icon={faHandHoldingUsd} />
              </Title>
            )}
            {!isEditing && (
              <ProfileMessage>
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={donationLink}
                  style={{ fontSize: "1.2em" }}
                >
                  {donationLink}
                </Link>
              </ProfileMessage>
            )}
            {isEditing && (
              <div style={{ marginBottom: "20px" }}>
                <Controller
                  name={"donationLink"}
                  as={Input}
                  type={"url"}
                  control={control}
                  defaultValue={donationLink}
                />
              </div>
            )}
          </ProfileField>
          {isEditing && (
            <div style={{ textAlign: "right" }}>
              <Space style={{ marginTop: "20px" }}>
                <WSButton onClick={onCancel} loading={isLoading}>
                  {t("common.cancel")}
                </WSButton>
                <WSButton loading={isLoading} htmlType="submit" type="primary">
                  {t("common.save")}
                </WSButton>
              </Space>
            </div>
          )}
        </Skeleton>
        {renderAdminBar()}
      </ProfileSider>
    </Form>
  );
};
