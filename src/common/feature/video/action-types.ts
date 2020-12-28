export const reducerName = "video";

export const videoActionTypes = {
  updateLoadedCaptionFromFile: `${reducerName}/updateLoadedCaptionFromFile`,
  updateShowCaption: `${reducerName}/updateShowCaption`,
  updateRenderer: `${reducerName}/updateRenderer`,
  closeMenuBar: `${reducerName}/closeMenuBar`,
  openMenuBar: `${reducerName}/openMenuBar`,
  loadCaptions: `${reducerName}/loadCaptions`,
  loadServerCaption: `${reducerName}/loadServerCaption`,
  likeCaption: `${reducerName}/likeCaption`,
  dislikeCaption: `${reducerName}/dislikeCaption`,
  requestFreshTabData: `${reducerName}/requestFreshTabData`,
  clearTabData: `${reducerName}/clearTabData`,
  closeTab: `${reducerName}/closeTab`,
  unsetTabData: `${reducerName}/unsetTabData`,
  setContentPageType: `${reducerName}/setContentPageType`,
  setCaption: `${reducerName}/setCaption`,
  setShowCaption: `${reducerName}/setShowCaption`,
  setServerCaptions: `${reducerName}/setServerCaptions`,
  setShowEditor: `${reducerName}/setShowEditor`,
  setRenderer: `${reducerName}/setRenderer`,
  setMenuHidden: `${reducerName}/setMenuHidden`,
};
