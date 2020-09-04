import { CaptionerFields } from "../captioner/types";
import { CaptionListFields } from "../video/types";

// Data for the profile of any captioner
export type ProfileState = {
  currentCaptionPage: number;
  captioner?: CaptionerFields;
  captions: CaptionListFields[];
};

export type LoadProfileParams = {
  profileId: string;
  withCaptions?: boolean;
};

export type PublicProfileData = {
  captions?: CaptionListFields[];
  captioner: CaptionerFields;
};

export type EditProfileFields = {
  email?: string;
  donationLink: string;
  profileMessage: string;
  languageCodes: string[];
};
