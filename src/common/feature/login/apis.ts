import { getFirebase } from "react-redux-firebase";

export const loginWithGoogleServer = async () => {
  const firebase = getFirebase();
  return await firebase.login({ provider: "google", type: "popup" });
};

export const logoutFromServer = async () => {
  const firebase = getFirebase();
  return await firebase.logout();
};
