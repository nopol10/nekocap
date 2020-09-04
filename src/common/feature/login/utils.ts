import * as firebase from "firebase/app";
import "firebase/auth";

export const webGoogleLogout = async (): Promise<void> => {
  await firebase.auth().signOut();
};
