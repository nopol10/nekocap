import { useQuery } from "@tanstack/react-query";

type YoutubeOEmbedVideoData = {
  provider_url: string;
  type?: string;
  html?: string;
  provider_name?: string;
  url?: string;
  width: number;
  author_name?: string;
  author_url?: string;
  height: number;
  thumbnail_height?: number;
  title?: string;
  version?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
};

export type YoutubeVideoData = {
  videoId: string;
  title?: string;
  width: number;
  height: number;
};

export function useYoutubeVideoData(videoId?: string) {
  return useQuery<YoutubeVideoData>({
    enabled: !!videoId,
    queryKey: ["youtubeData", videoId],
    queryFn: async () => {
      const response = await fetch(
        `https://noembed.com/embed?url=http%3A//www.youtube.com/watch%3Fv%3D${videoId}`,
      );
      const youtubeData: YoutubeOEmbedVideoData = await response.json();
      const finalData: YoutubeVideoData = {
        videoId: videoId || "",
        title: youtubeData.title,
        width: youtubeData.width,
        height: youtubeData.height,
      };
      return finalData;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });
}
