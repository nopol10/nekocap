import { RootState } from "@/common/store/types";

export const captionerSelector = (state: RootState) => state.captioner;
export const isCurrentUserAdminSelector = (state: RootState) => {
  if (!state.captioner || !state.captioner.privateProfile) {
    return false;
  }
  return state.captioner.privateProfile.isAdmin;
};

export const isCurrentUserReviewerSelector = (state: RootState) => {
  if (!state.captioner || !state.captioner.privateProfile) {
    return false;
  }
  return state.captioner.privateProfile.isReviewer;
};

export const isCurrentUserReviewerManagerSelector = (state: RootState) => {
  if (!state.captioner || !state.captioner.privateProfile) {
    return false;
  }
  return state.captioner.privateProfile.isReviewerManager;
};
