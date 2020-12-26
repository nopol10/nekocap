import Layout from "antd/lib/layout";
import React from "react";
import { ReactNode } from "react";
import styled from "styled-components";
import audioDescriptionImage from "@/assets/images/audio-description.jpg";
import { getImageLink } from "../chrome-utils";

export const MediumTag = styled.img`
  width: 50px;
  border-radius: 10px;
  vertical-align: middle;
`;

export const SmallTag = styled.img`
  width: 26px;
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
  <WSTag src={getImageLink(audioDescriptionImage)} />
);
