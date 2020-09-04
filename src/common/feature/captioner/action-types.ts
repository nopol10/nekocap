export const reducerName = "captioner";

export const captionerActionTypes = {
  loadUserCaptions: `${reducerName}/loadUserCaptions`,
  loadPrivateCaptionerData: `${reducerName}/loadPrivateCaptionerData`,
  updateCaptionerProfile: `${reducerName}/updateCaptionerProfile`,
  deleteServerCaption: `${reducerName}/deleteServerCaption`,

  setCaptionerPrivateData: `${reducerName}/setCaptionerPrivateData`,
  setListedCaptions: `${reducerName}/setListedCaptions`,
  removeStoreCaption: `${reducerName}/removeStoreCaption`,
};
