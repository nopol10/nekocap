import { RootState } from "@/common/store/types";

export const userExtensionPreferenceSelector = (state: RootState) =>
  state.userExtensionPreference;
