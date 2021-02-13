export const reducerName = "publicDashboard";

export const publicDashboardActionTypes = {
  loadLatestCaptions: `${reducerName}/loadLatestCaptions`,
  loadLatestUserLanguageCaptions: `${reducerName}/loadLatestUserLanguageCaptions`,
  loadPopularCaptions: `${reducerName}/loadPopularCaptions`,
  loadAllCaptions: `${reducerName}/loadAllCaptions`,

  setLatestCaptions: `${reducerName}/setLatestCaptions`,
  setLatestUserLanguageCaptions: `${reducerName}/setLatestUserLanguageCaptions`,
  setPopularCaptions: `${reducerName}/setPopularCaptions`,
  setBrowseResults: `${reducerName}/setBrowseResults`,
};
