import {
  nekocapApi,
  nekocapQueryMaker,
  nekocapMutationMaker,
} from "@/common/store/api";

export const PROFILE_CAPTION_TAGS_TAG = "profileCaptionTags";

export const profileApi = nekocapApi
  .enhanceEndpoints({ addTagTypes: [PROFILE_CAPTION_TAGS_TAG] })
  .injectEndpoints({
    endpoints: (builder) => {
      return {
        getOwnProfileTags: nekocapQueryMaker(builder, "getOwnProfileTags", {
          providesTags: [PROFILE_CAPTION_TAGS_TAG],
        }),
        deleteProfileTag: nekocapMutationMaker(builder, "deleteProfileTag", {
          invalidatesTags: [PROFILE_CAPTION_TAGS_TAG],
        }),
      };
    },
  });

export const {
  useGetOwnProfileTagsQuery,
  useDeleteProfileTagMutation,
} = profileApi;
