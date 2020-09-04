export const reducerName = "profile";

export const profileActionTypes = {
  loadProfile: `${reducerName}/loadProfile`,
  loadUserCaptions: `${reducerName}/loadUserCaptions`,
  updateProfile: `${reducerName}/updateProfile`,
  assignReviewerManager: `${reducerName}/assignReviewerManager`,
  assignReviewer: `${reducerName}/assignReviewer`,
  verifyCaptioner: `${reducerName}/verifyCaptioner`,
  banCaptioner: `${reducerName}/banCaptioner`,
  setProfile: `${reducerName}/setProfile`,
  setListedCaptions: `${reducerName}/setListedCaptions`,
};
