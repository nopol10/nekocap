import { LoginState } from "../feature/login/types";
import { VideoState } from "../feature/video/types";
import { CaptionerState } from "../feature/captioner/types";
import { PublicDashboardState } from "../feature/public-dashboard/types";
import { ProfileState } from "../feature/profile/types";
import { CaptionReviewState } from "../feature/caption-review/types";
import { SearchState } from "../feature/search/types";
import { CaptionEditorState } from "../feature/caption-editor/types";
import { UserExtensionPreferenceState } from "../../extension/background/feature/user-extension-preference/types";

export type RootState = {
  login: LoginState;
  video: VideoState;
  captioner: CaptionerState;
  publicDashboard: PublicDashboardState;
  captionReview: CaptionReviewState;
  profile: ProfileState;
  search: SearchState;
  captionEditor: CaptionEditorState;
  userExtensionPreference: UserExtensionPreferenceState;
};
