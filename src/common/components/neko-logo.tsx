import React from "react";
import styled from "styled-components";
import NekoLogoSvg from "-!react-svg-loader!@/assets/images/nekocap.svg";
import { styledNoPass } from "../style-utils";

type NekoLogoProps = {
  width?: string;
  height?: string;
};

const NekoTitle = styledNoPass<NekoLogoProps>("div")`
  width: ${({ width, height }) => {
    if (width !== undefined) {
      return width;
    } else if (height !== undefined && width === undefined) {
      return "auto";
    }
    return "100%";
  }};
  height: ${({ width, height }) => {
    if (height !== undefined) {
      return height;
    } else if (width !== undefined && height === undefined) {
      return "auto";
    }
    return "auto";
  }};

  path.letter {
    fill: #ffc011;
  }

  path.cat {
    fill: #11cfff;
  }
`;

export const NekoLogo = ({ width, height }: NekoLogoProps) => {
  return (
    <NekoTitle width={width} height={height}>
      <a href="https://nekocap.com/" target="_blank" rel="noreferrer">
        <NekoLogoSvg />
      </a>
    </NekoTitle>
  );
};
