import { LoginMethod, UserData } from "@/common/providers/backend-provider";

export type LoginState = {
  loggedIn: boolean;
  done?: boolean;
  userData?: UserData;
};

export type LoginRequest = {
  background: boolean;
};

export type LoginStorage = {
  loginMethod?: LoginMethod;
  sessionToken?: string;
};
