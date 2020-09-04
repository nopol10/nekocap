export const reducerName = "login";

export const loginActionTypes = {
  autoLogin: `${reducerName}/autoLogin`,
  loginSuccess: `${reducerName}/loginSuccess`,
  loginWithGoogle: `${reducerName}/loginWithGoogle`,
  webAutoLogin: `${reducerName}/webAutoLogin`,
  webLoginWithGoogle: `${reducerName}/webLoginWithGoogle`,
  webLogout: `${reducerName}/webLogout`,
  logout: `${reducerName}/logout`,
  setLoggedIn: `${reducerName}/setLoggedIn`,
  setUserData: `${reducerName}/setUserData`,
  webLoginSuccess: `${reducerName}/webLoginSuccess`,
};
