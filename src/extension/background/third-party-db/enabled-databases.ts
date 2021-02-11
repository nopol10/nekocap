import type { ThirdPartyDatabase } from "./third-party-database";
import { YoutubeExternalCC } from "./yt-external-cc";

export const ENABLED_THIRD_PARTY_DATABASES: {
  [id: string]: ThirdPartyDatabase;
} = {
  [YoutubeExternalCC.name]: YoutubeExternalCC,
};
