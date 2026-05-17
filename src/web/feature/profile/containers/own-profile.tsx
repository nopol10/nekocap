import { exportCaption } from "@/common/feature/caption-editor/export-caption";
import {
  deleteServerCaption,
  loadUserCaptions as loadLoggedInUserCaptions,
  loadPrivateCaptionerData,
} from "@/common/feature/captioner/actions";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { AdvancedFilter } from "@/common/feature/captioner/types";
import {
  assignReviewer,
  assignReviewerManager,
  updateProfile,
} from "@/common/feature/profile/actions";
import { EditProfileFields } from "@/common/feature/profile/types";
import { CaptionListFields } from "@/common/feature/video/types";
import { message } from "antd";
import { useTranslation } from "next-i18next";
import { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CAPTION_LIST_PAGE_SIZE } from "../../common/components/caption-list";
import { loadWebsiteViewerCaptionApi } from "../../viewer/api";
import {
  handleAssignReviewer,
  handleAssignReviewerManager,
  handleBanCaptioner,
  handleVerifyCaptioner,
} from "../admin-utils";
import { EMPTY_PROFILE, Profile } from "../components/profile";

export const OwnProfile = (): ReactElement => {
  const captionerState = useSelector(captionerSelector);

  const isLoadingProfile = useSelector(
    loadPrivateCaptionerData.isLoading(undefined),
  );
  const isUpdatingProfile = useSelector(updateProfile.isLoading(undefined));
  const isAssigningReviewer = useSelector(assignReviewer.isLoading(undefined));
  const isLoadingCaptionPage = useSelector(
    loadLoggedInUserCaptions.isLoading(undefined),
  );
  const isAssigningReviewerManager = useSelector(
    assignReviewerManager.isLoading(undefined),
  );

  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation("common");

  const {
    currentCaptionPage: currentCaptionPage,
    captions = [],
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
        }),
      );
    }
  }, [captioner.captionCount]);

  const handleChangeCaptionPage = (
    page: number,
    pageSize = 1,
    tags?: string[],
    advancedFilter?: AdvancedFilter,
  ) => {
    dispatch(
      loadLoggedInUserCaptions.request({
        pageSize,
        pageNumber: page,
        captionerId,
        tags,
        advancedFilter,
      }),
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

  const handleDownloadCaption = async (captionId: string) => {
    try {
      const caption = await loadWebsiteViewerCaptionApi(captionId);
      exportCaption(caption);
    } catch (error) {
      void message.error("Error downloading caption");
      console.error("Error downloading caption", error);
    }
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

  const handleSetFilters = (tags: string[], advancedFilter: AdvancedFilter) => {
    handleChangeCaptionPage(1, CAPTION_LIST_PAGE_SIZE, tags, advancedFilter);
  };

  const handleUpdateCaption = () => {
    // Load the latest tags
    dispatch(
      loadPrivateCaptionerData.request({
        withCaptions: true,
      }),
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
      onDownloadCaption={handleDownloadCaption}
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
        dispatch,
      )}
      onAssignReviewer={handleAssignReviewer(captionerId, dispatch)}
      onVerifyCaptioner={handleVerifyCaptioner(captionerId, dispatch)}
      onBanCaptioner={handleBanCaptioner(captionerId, dispatch)}
      onSetFilters={handleSetFilters}
      onUpdateCaption={handleUpdateCaption}
    />
  );
};
