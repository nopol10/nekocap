import { signOut } from "firebase/auth";

export const webGoogleLogout = async (): Promise<void> => {
  await signOut(globalThis.firebaseAuth);
};
