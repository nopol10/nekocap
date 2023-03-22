import React from "react";
import { hasTag } from "@/common/caption-utils";
import {
  AdvancedCaptionTag,
  AudioDescribedTag,
  YTExternalCCTag,
} from "@/common/components/ws-tag";
import { captionTags } from "@/common/constants";

export type CaptionTagsProps = {
  caption: {
    tags: string[];
    advanced: boolean;
  };
};

export function CaptionTags({ caption }: CaptionTagsProps) {
  return (
    <>
      {hasTag(caption.tags, captionTags.audioDescribed) && (
        <AudioDescribedTag />
      )}
      {hasTag(caption.tags, captionTags.ytExCC) && <YTExternalCCTag />}
      {caption.advanced && <AdvancedCaptionTag />}
    </>
  );
}
