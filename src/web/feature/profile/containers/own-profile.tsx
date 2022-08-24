import React, { ReactElement, useEffect, useState } from "react";
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
import { CAPTION_LIST_PAGE_SIZE } from "../../common/components/caption-list";

export const OwnProfile = (): ReactElement => {
  const captionerState = useSelector(captionerSelector);

  const isLoadingProfile = useSelector(
    loadPrivateCaptionerData.isLoading(undefined)
  );
  const isUpdatingProfile = useSelector(updateProfile.isLoading(undefined));
  const isAssigningReviewer = useSelector(assignReviewer.isLoading(undefined));
  const isLoadingCaptionPage = useSelector(
    loadLoggedInUserCaptions.isLoading(undefined)
  );
  const isAssigningReviewerManager = useSelector(
    assignReviewerManager.isLoading(undefined)
  );

  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation("common");

  const {
    currentCaptionPage: currentCaptionPage,
    captions,
    captioner = EMPTY_PROFILE,
    privateProfile,
    hasMore,
  } = captionerState;

  const { userId: captionerId } = captioner;
  const isLoading =
    isLoadingProfile ||
    isUpdatingProfile ||
    isAssigningReviewer ||
    isAssigningReviewerManager;

  /**
   * If the user has captions that were not loaded
   * (e.g. after going to their dashboard from homepage right after logging in),
   * load them.
   */
  useEffect(() => {
    if (
      captioner.captionCount > 0 &&
      (captions?.length || 0) <= 0 &&
      !isLoadingCaptionPage
    ) {
      dispatch(
        loadLoggedInUserCaptions.request({
          pageSize: CAPTION_LIST_PAGE_SIZE,
          pageNumber: 1,
          captionerId,
        })
      );
    }
  }, [captioner.captionCount]);

  const handleChangeCaptionPage = (
    page: number,
    pageSize = 1,
    tags?: string[]
  ) => {
    dispatch(
      loadLoggedInUserCaptions.request({
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

  const handleSetFilteredTags = (tags: string[]) => {
    handleChangeCaptionPage(1, CAPTION_LIST_PAGE_SIZE, tags);
  };

  const handleUpdateCaption = () => {
    // Load the latest tags
    dispatch(
      loadPrivateCaptionerData.request({
        withCaptions: true,
      })
    );
  };
  return (
    <Profile
      loggedInUser={captioner}
      privateData={privateProfile}
      captioner={captioner}
      captions={captions || []}
      currentCaptionPage={currentCaptionPage}
      onDelete={handleConfirmDelete}
      onChangePage={handleChangeCaptionPage}
      isLoading={isLoading}
      isLoadingCaptionPage={isLoadingCaptionPage}
      isEditing={isEditing}
      canEdit={true}
      hasMore={hasMore}
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
      onSetFilteredTags={handleSetFilteredTags}
      onUpdateCaption={handleUpdateCaption}
    />
  );
};
