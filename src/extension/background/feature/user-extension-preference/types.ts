import { languages } from "@/common/languages";

export enum AutoloadMethod {
  NoAutoload,
  AutoloadPreferredOnly,
  AutoloadPreferredOrFirst,
}

export type UserExtensionPreferenceState = {
  hideToolbarIfNoCaptions: boolean;
  autosave: boolean;
  // Auto load
  autoloadMethod: AutoloadMethod;
  preferredLanguage: keyof typeof languages | "none";
};
