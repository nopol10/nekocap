import React from "react";
import styled from "styled-components";
import audioDescriptionImage from "@/assets/images/audio-description.jpg";
import ytexccImage from "@/assets/images/ytexcc-tag.jpg";
import advancedCaptionImage from "@/assets/images/advanced-caption.jpg";
import { getImageLink } from "../chrome-utils";

export const MediumTag = styled.img`
  width: 50px;
  height: auto;
  border-radius: 10px;
  vertical-align: middle;
`;

export const SmallTag = styled.img`
  width: 26px;
  height: auto;
  border-radius: 5px;
  margin-left: 5px;
`;

type WSTagProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  size?: "small" | "medium";
};
export const WSTag = ({ size = "small", ...rest }: WSTagProps) => {
  if (size === "small") {
    return <SmallTag {...rest} />;
  } else {
    return <MediumTag {...rest} />;
  }
};

export const AudioDescribedTag = () => (
  <WSTag title="Audio described" src={getImageLink(audioDescriptionImage)} />
);

export const YTExternalCCTag = () => (
  <WSTag
    title="Originally from Youtube External CC"
    src={getImageLink(ytexccImage)}
  />
);

export const AdvancedCaptionTag = () => (
  <WSTag title="Advanced Caption" src={getImageLink(advancedCaptionImage)} />
);
