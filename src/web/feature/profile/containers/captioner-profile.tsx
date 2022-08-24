import React, { useEffect } from "react";
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { profileSelector } from "@/common/feature/profile/selectors";
import {
  assignReviewer,
  assignReviewerManager,
  loadProfile,
  loadUserCaptions,
} from "@/common/feature/profile/actions";
import { deleteServerCaption } from "@/common/feature/captioner/actions";
import { CaptionListFields } from "@/common/feature/video/types";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { EMPTY_PROFILE, Profile } from "../components/profile";
import {
  handleAssignReviewer,
  handleAssignReviewerManager,
  handleBanCaptioner,
  handleVerifyCaptioner,
} from "../admin-utils";
import Title from "antd/lib/typography/Title";
import { useTranslation } from "next-i18next";
import { CAPTION_LIST_PAGE_SIZE } from "../../common/components/caption-list";

export const CaptionerProfile = () => {
  const dispatch = useDispatch();
  const profileData = useSelector(profileSelector);
  const isLoadingProfile = useSelector(loadProfile.isLoading(null));
  const isLoadingCaptionPage = useSelector(loadUserCaptions.isLoading(null));
  const captionerState = useSelector(captionerSelector);
  const isAssigningReviewer = useSelector(assignReviewer.isLoading(null));
  const isAssigningReviewerManager = useSelector(
    assignReviewerManager.isLoading(null)
  );
  const { t } = useTranslation("common");

  const {
    currentCaptionPage,
    captions,
    captioner = EMPTY_PROFILE,
    hasMore,
  } = profileData;
  if (!captioner) {
    return <Title style={{ padding: "0 50px" }}>User not found!</Title>;
  }
  const { userId: captionerId } = captioner;

  const { captioner: loggedInUserPublicProfile } = captionerState;

  const isLoading =
    isLoadingProfile || isAssigningReviewer || isAssigningReviewerManager;

  const handleChangeCaptionPage = (
    page: number,
    pageSize?: number,
    tags?: string[]
  ) => {
    dispatch(
      loadUserCaptions.request({
        pageSize,
        pageNumber: page,
        captionerId,
        tags,
      })
    );
  };

  const handleConfirmDelete = (caption: CaptionListFields) => {
    dispatch(deleteServerCaption.request(caption.id))
      .then(() => {
        message.success(t("profile.captionDeleted"));
      })
      .catch((error) => {
        message.error(t("profile.captionDeletionFailed", { error: error }));
      });
  };

  const handleSetFilteredTags = (tags: string[]) => {
    handleChangeCaptionPage(1, CAPTION_LIST_PAGE_SIZE, tags);
  };

  const handleUpdateCaption = () => {
    // Load the latest tags
    dispatch(
      loadProfile.request({
        profileId: captionerId,
        withCaptions: true,
      })
    );
  };

  return (
    <Profile
      loggedInUser={loggedInUserPublicProfile}
      captioner={captioner}
      captions={captions}
      currentCaptionPage={currentCaptionPage}
      onDelete={handleConfirmDelete}
      onChangePage={handleChangeCaptionPage}
      isLoading={isLoading}
      isLoadingCaptionPage={isLoadingCaptionPage}
      hasMore={hasMore}
      onAssignReviewerManager={handleAssignReviewerManager(
        captionerId,
        dispatch
      )}
      onAssignReviewer={handleAssignReviewer(captionerId, dispatch)}
      onVerifyCaptioner={handleVerifyCaptioner(captionerId, dispatch)}
      onBanCaptioner={handleBanCaptioner(captionerId, dispatch)}
      onSetFilteredTags={handleSetFilteredTags}
      onUpdateCaption={handleUpdateCaption}
    />
  );
};
