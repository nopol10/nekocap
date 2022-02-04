import {
  BackendProviderRequest,
  BackendProviderRequestTypes,
} from "./passthrough-provider";

export async function performBackendProviderRequest(
  request: BackendProviderRequest
): Promise<any> {
  const window = globalThis;
  if (request.type === BackendProviderRequestTypes.Login) {
    return window.backendProvider.login(request.method, request.options);
  } else if (request.type === BackendProviderRequestTypes.Logout) {
    return window.backendProvider.logout(request.options);
  } else if (request.type === BackendProviderRequestTypes.LoadCaptions) {
    return window.backendProvider.loadCaptions({
      videoId: request.videoId,
      videoSource: request.videoSource,
    });
  } else if (request.type === BackendProviderRequestTypes.LoadUserCaptions) {
    return window.backendProvider.loadUserCaptions(request.request);
  } else if (
    request.type === BackendProviderRequestTypes.LoadPrivateCaptioner
  ) {
    return window.backendProvider.loadPrivateCaptionerData({
      withCaptions: request.withCaptions,
    });
  } else if (request.type === BackendProviderRequestTypes.LoadProfile) {
    return window.backendProvider.loadProfile(request.options);
  } else if (
    request.type === BackendProviderRequestTypes.UpdateCaptionerProfile
  ) {
    return window.backendProvider.updateCaptionerProfile(request.params);
  } else if (request.type === BackendProviderRequestTypes.LoadLatestCaptions) {
    return window.backendProvider.loadLatestCaptions();
  } else if (
    request.type === BackendProviderRequestTypes.LoadLatestUserLanguageCaptions
  ) {
    return window.backendProvider.loadLatestUserLanguageCaptions(
      request.languageCode
    );
  } else if (request.type === BackendProviderRequestTypes.LoadPopularCaptions) {
    return window.backendProvider.loadPopularCaptions();
  } else if (request.type === BackendProviderRequestTypes.LoadCaption) {
    return window.backendProvider.loadCaption({ captionId: request.captionId });
  } else if (
    request.type === BackendProviderRequestTypes.LoadCaptionForReview
  ) {
    return window.backendProvider.loadCaptionForReview({
      captionId: request.captionId,
    });
  } else if (request.type === BackendProviderRequestTypes.LikeCaption) {
    return window.backendProvider.likeCaption({ captionId: request.captionId });
  } else if (request.type === BackendProviderRequestTypes.DislikeCaption) {
    return window.backendProvider.dislikeCaption({
      captionId: request.captionId,
    });
  } else if (request.type === BackendProviderRequestTypes.DeleteCaption) {
    return window.backendProvider.deleteCaption({
      captionId: request.captionId,
    });
  } else if (request.type === BackendProviderRequestTypes.SubmitCaption) {
    return window.backendProvider.submitCaption(request.request);
  } else if (request.type === BackendProviderRequestTypes.UpdateCaption) {
    return window.backendProvider.updateCaption(request.request);
  } else if (request.type === BackendProviderRequestTypes.RejectCaption) {
    return window.backendProvider.rejectCaption(request.params);
  } else if (request.type === BackendProviderRequestTypes.VerifyCaption) {
    return window.backendProvider.verifyCaption(request.params);
  } else if (
    request.type === BackendProviderRequestTypes.AssignReviewerManager
  ) {
    return window.backendProvider.assignReviewerManager(request.params);
  } else if (request.type === BackendProviderRequestTypes.AssignReviewer) {
    return window.backendProvider.assignReviewer(request.params);
  } else if (request.type === BackendProviderRequestTypes.VerifyCaptioner) {
    return window.backendProvider.verifyCaptioner(request.params);
  } else if (request.type === BackendProviderRequestTypes.BanCaptioner) {
    return window.backendProvider.banCaptioner(request.params);
  } else if (request.type === BackendProviderRequestTypes.Search) {
    return window.backendProvider.search(request.params);
  } else if (request.type === BackendProviderRequestTypes.Browse) {
    return window.backendProvider.browse(request.params);
  } else if (request.type === BackendProviderRequestTypes.GetAutoCaptionList) {
    return window.backendProvider.getAutoCaptionList(request.params);
  }
}
