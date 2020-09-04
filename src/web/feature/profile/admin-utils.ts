import {
  assignReviewer,
  assignReviewerManager,
  banCaptioner,
  verifyCaptioner,
} from "@/common/feature/profile/actions";
import { Dispatch } from "redux";
import { message } from "antd";

export const handleAssignReviewerManager = (
  captionerId: string,
  dispatch: Dispatch<any>
) => () => {
  dispatch(assignReviewerManager.request(captionerId))
    .then(() => {
      message.success("Updated!");
    })
    .catch((error) => {
      message.error(`Failed to update: ${error}`);
    });
};

export const handleAssignReviewer = (
  captionerId: string,
  dispatch: Dispatch<any>
) => () => {
  dispatch(assignReviewer.request(captionerId))
    .then(() => {
      message.success("Updated!");
    })
    .catch((error) => {
      message.error(`Failed to update: ${error}`);
    });
};

export const handleVerifyCaptioner = (
  captionerId: string,
  dispatch: Dispatch<any>
) => () => {
  dispatch(verifyCaptioner.request(captionerId))
    .then(() => {
      message.success("Updated!");
    })
    .catch((error) => {
      message.error(`Failed to update: ${error}`);
    });
};

export const handleBanCaptioner = (
  captionerId: string,
  dispatch: Dispatch<any>
) => () => {
  dispatch(banCaptioner.request(captionerId))
    .then(() => {
      message.success("Updated!");
    })
    .catch((error) => {
      message.error(`Failed to update: ${error}`);
    });
};
