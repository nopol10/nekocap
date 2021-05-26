import { Locator } from "@/common/locator/locator";

export const loadCaptionerProfileApi = async (profileId: string) => {
  const profile = await Locator.provider().loadProfile({
    profileId,
  });

  return profile;
};
