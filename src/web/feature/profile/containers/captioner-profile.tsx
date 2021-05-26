import React, { useEffect } from "react";
import { message } from "antd";
import { useParams } from "react-router-dom";
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

  const {
    currentCaptionPage,
    captions,
    captioner = EMPTY_PROFILE,
  } = profileData;

  const { userId: captionerId } = captioner;

  const { captioner: loggedInUserPublicProfile } = captionerState;

  const isLoading =
    isLoadingProfile || isAssigningReviewer || isAssigningReviewerManager;

  const handleChangeCaptionPage = (page: number, pageSize?: number) => {
    dispatch(
      loadUserCaptions.request({
        pageSize,
        pageNumber: page,
        captionerId,
      })
    );
  };

  const handleConfirmDelete = (caption: CaptionListFields) => {
    dispatch(deleteServerCaption.request(caption.id))
      .then(() => {
        message.success("Caption deleted! :(");
      })
      .catch((error) => {
        message.error(`Failed to delete caption: ${error}`);
      });
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
