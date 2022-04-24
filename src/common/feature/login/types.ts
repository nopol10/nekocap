import { LoginMethod, UserData } from "@/common/providers/backend-provider";

export type LoginState = {
  loggedIn: boolean;
  done?: boolean;
  userData?: UserData;
};

export type LoginRequest = {
  background: boolean;
  withCaptions: boolean;
};

export type WebAutoLoginRequest = {
  withCaptions: boolean;
};

export type LoginStorage = {
  loginMethod?: LoginMethod;
  sessionToken?: string;
};

export type FirebaseLoggedInUser = {
  id: string;
  credentialIdToken: string; // For use with GoogleAuthProvider.credential
  idToken: string; // For use with parse-firebase user auth
  name: string;
};

export type WebLoginSuccess = {
  userData: UserData;
  withCaptions: boolean;
};
