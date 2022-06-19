import React, { ReactElement, useState } from "react";
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  assignReviewer,
  assignReviewerManager,
  updateProfile,
} from "@/common/feature/profile/actions";
import {
  loadPrivateCaptionerData,
  loadUserCaptions as loadLoggedInUserCaptions,
} from "@/common/feature/captioner/actions";
import { deleteServerCaption } from "@/common/feature/captioner/actions";
import { CaptionListFields } from "@/common/feature/video/types";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { EditProfileFields } from "@/common/feature/profile/types";
import { EMPTY_PROFILE, Profile } from "../components/profile";
import {
  handleAssignReviewer,
  handleAssignReviewerManager,
  handleBanCaptioner,
  handleVerifyCaptioner,
} from "../admin-utils";
import { useTranslation } from "next-i18next";

export const OwnProfile = (): ReactElement => {
  const captionerState = useSelector(captionerSelector);

  const isLoadingProfile = useSelector(
    loadPrivateCaptionerData.isLoading(null)
  );
  const isUpdatingProfile = useSelector(updateProfile.isLoading(null));
  const isAssigningReviewer = useSelector(assignReviewer.isLoading(null));
  const isLoadingCaptionPage = useSelector(
    loadLoggedInUserCaptions.isLoading(null)
  );
  const isAssigningReviewerManager = useSelector(
    assignReviewerManager.isLoading(null)
  );

  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation("common");

  const {
    currentCaptionPage: currentCaptionPage,
    captions,
    captioner = EMPTY_PROFILE,
    privateProfile,
  } = captionerState;

  const { userId: captionerId } = captioner;
  const isLoading =
    isLoadingProfile ||
    isUpdatingProfile ||
    isAssigningReviewer ||
    isAssigningReviewerManager;

  const handleChangeCaptionPage = (page: number, pageSize?: number) => {
    dispatch(
      loadLoggedInUserCaptions.request({
        pageSize,
        pageNumber: page,
        captionerId,
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

  const handleSubmitEdit = (form: EditProfileFields) => {
    dispatch(updateProfile.request(form))
      .then(() => {
        message.success(t("profile.profileUpdated"));
        setIsEditing(false);
      })
      .catch((error) => {
        message.error(t("profile.profileUpdateFailed", { error: error }));
      });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <Profile
      loggedInUser={captioner}
      privateData={privateProfile}
      captioner={captioner}
      captions={captions}
      currentCaptionPage={currentCaptionPage}
      onDelete={handleConfirmDelete}
      onChangePage={handleChangeCaptionPage}
      isLoading={isLoading}
      isLoadingCaptionPage={isLoadingCaptionPage}
      isEditing={isEditing}
      canEdit={true}
      onSetEditing={setIsEditing}
      onSubmitEdit={handleSubmitEdit}
      onCancelEdit={handleCancelEdit}
      onAssignReviewerManager={handleAssignReviewerManager(
        captionerId,
        dispatch
      )}
      onAssignReviewer={handleAssignReviewer(captionerId, dispatch)}
      onVerifyCaptioner={handleVerifyCaptioner(captionerId, dispatch)}
      onBanCaptioner={handleBanCaptioner(captionerId, dispatch)}
    />
  );
};
