import React from "react";
import NekoLogoSvg from "-!@svgr/webpack!@/assets/images/nekocap.svg";
import styled from "styled-components";

type NekoLogoProps = {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
};

const NekoTitle = styled("div").withConfig<NekoLogoProps>({
  shouldForwardProp: (prop, defPropValFn) => defPropValFn(prop),
})`
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

export const NekoLogo = ({ width, height, style }: NekoLogoProps) => {
  return (
    <NekoTitle width={width} height={height} style={style}>
      <a href="https://nekocap.com/" target="_blank" rel="noreferrer">
        <NekoLogoSvg />
      </a>
    </NekoTitle>
  );
};

export const NekoLogoPopup = () => {
  return (
    <NekoLogo
      width={undefined}
      height={undefined}
      style={{
        maxWidth: "300px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    />
  );
};
