import { VideoSource } from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";

/**
 * Video details used to fill in a preview link's meta tags.
 *
 * Link unfurlers (Discord, Slack, Twitter) fetch the page server side and read
 * its meta tags without running any JavaScript, and the URL hash never reaches
 * the server at all. So the caption payload in the hash cannot describe the
 * embed - the video id has to arrive as a query param and be resolved here,
 * server side, before the HTML is sent.
 */
/**
 * null rather than undefined throughout: this crosses the Next.js props
 * boundary, which only accepts JSON-serializable values.
 */
export type PreviewVideoMetadata = {
  videoId: string;
  videoSource: VideoSource;
  title: string | null;
  thumbnailUrl: string | null;
};

/** Video ids across the supported sites are short and alphanumeric-ish. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const OEMBED_URL = "https://noembed.com/embed?url=";
const OEMBED_TIMEOUT_MS = 3000;

/**
 * Reads and validates the video a preview link points at, from the page's
 * query params. Returns undefined when they are absent or implausible, in
 * which case the page falls back to generic meta tags.
 *
 * The rendered captions still come from the hash - these params only exist so
 * the server can describe the video.
 */
export const parsePreviewVideoParams = (query: {
  v?: string | string[];
  s?: string | string[];
}): { videoId: string; videoSource: VideoSource } | undefined => {
  const rawVideoId = Array.isArray(query.v) ? query.v[0] : query.v;
  if (!rawVideoId || !VIDEO_ID_PATTERN.test(rawVideoId)) {
    return undefined;
  }
  const rawSource = Array.isArray(query.s) ? query.s[0] : query.s;
  const videoSource =
    rawSource === undefined ? VideoSource.Youtube : Number(rawSource);
  if (!Number.isInteger(videoSource)) {
    return undefined;
  }
  const processor = videoSourceToProcessorMap[videoSource as VideoSource];
  if (!processor || !processor.canWatchInNekoCapSite) {
    return undefined;
  }
  return { videoId: rawVideoId, videoSource: videoSource as VideoSource };
};

/**
 * Looks up a video's title and thumbnail through oEmbed. Never throws and is
 * time limited: a preview link should still unfurl with generic details rather
 * than hang or fail the page when the oEmbed provider is slow or down.
 */
export const fetchPreviewVideoMetadata = async ({
  videoId,
  videoSource,
}: {
  videoId: string;
  videoSource: VideoSource;
}): Promise<PreviewVideoMetadata> => {
  const metadata: PreviewVideoMetadata = {
    videoId,
    videoSource,
    title: null,
    thumbnailUrl: null,
  };
  const processor = videoSourceToProcessorMap[videoSource];
  if (!processor) {
    return metadata;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
  try {
    const videoLink = processor.generateVideoLink(videoId);
    const response = await fetch(
      `${OEMBED_URL}${encodeURIComponent(videoLink)}`,
      { signal: controller.signal },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        title?: string;
        thumbnail_url?: string;
      };
      metadata.title = data.title || null;
      metadata.thumbnailUrl = data.thumbnail_url || null;
    }
  } catch (e) {
    console.warn("[preview] Could not load video metadata", e);
  } finally {
    clearTimeout(timeout);
  }
  if (!metadata.thumbnailUrl) {
    try {
      metadata.thumbnailUrl =
        (await processor.generateThumbnailLink(videoId)) || null;
    } catch (e) {
      // Leave the thumbnail out rather than failing the page
    }
  }
  return metadata;
};
