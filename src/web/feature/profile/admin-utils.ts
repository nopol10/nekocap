import {
  assignReviewer,
  assignReviewerManager,
  banCaptioner,
  verifyCaptioner,
} from "@/common/feature/profile/actions";
import { Dispatch } from "redux";
import { message } from "antd";
import { i18n } from "next-i18next";

export const handleAssignReviewerManager =
  (captionerId: string, dispatch: Dispatch<any>) => () => {
    dispatch(assignReviewerManager.request(captionerId))
      .then(() => {
        message.success(i18n?.t("profile.roleAssignmentSuccess"));
      })
      .catch((error) => {
        message.error(
          i18n?.t("profile.roleAssignmentFailure", { error: error })
        );
      });
  };

export const handleAssignReviewer =
  (captionerId: string, dispatch: Dispatch<any>) => () => {
    dispatch(assignReviewer.request(captionerId))
      .then(() => {
        message.success(i18n?.t("profile.roleAssignmentSuccess"));
      })
      .catch((error) => {
        message.error(
          i18n?.t("profile.roleAssignmentFailure", { error: error })
        );
      });
  };

export const handleVerifyCaptioner =
  (captionerId: string, dispatch: Dispatch<any>) => () => {
    dispatch(verifyCaptioner.request(captionerId))
      .then(() => {
        message.success(i18n?.t("profile.roleAssignmentSuccess"));
      })
      .catch((error) => {
        message.error(
          i18n?.t("profile.roleAssignmentFailure", { error: error })
        );
      });
  };

export const handleBanCaptioner =
  (captionerId: string, dispatch: Dispatch<any>) => () => {
    dispatch(banCaptioner.request(captionerId))
      .then(() => {
        message.success(i18n?.t("profile.roleAssignmentSuccess"));
      })
      .catch((error) => {
        message.error(
          i18n?.t("profile.roleAssignmentFailure", { error: error })
        );
      });
  };
