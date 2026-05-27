import NekoLogoSvg from "@/assets/images/nekocap.svg?react";
import { DEVICE } from "@/common/style-constants";
import Link from "next/link";
import React from "react";
import styled from "styled-components";

type NekoLogoProps = {
  $width?: string;
  $height?: string;
  style?: React.CSSProperties;
};

const NekoTitle = styled.div<NekoLogoProps>`
  width: ${({ $width, $height }) => {
    if ($width !== undefined) {
      return $width;
    } else if ($height !== undefined && $width === undefined) {
      return "auto";
    }
    return "100%";
  }};
  height: ${({ $width, $height }) => {
    if ($height !== undefined) {
      return $height;
    } else if ($width !== undefined && $height === undefined) {
      return "auto";
    }
    return "auto";
  }};

  @media ${DEVICE.tablet} {
    max-width: 500px;
    margin: 0 auto;
  }

  @media ${DEVICE.desktop} {
    margin: 0 0;
  }

  path.letter {
    fill: #ffc011;
  }

  path.cat {
    fill: #11cfff;
  }
`;

export const NekoLogo = ({ $width, $height, style }: NekoLogoProps) => {
  return (
    <NekoTitle $width={$width} $height={$height} style={style}>
      <Link href="https://nekocap.com/">
        <NekoLogoSvg />
      </Link>
    </NekoTitle>
  );
};

export const NekoLogoPopup = () => {
  return (
    <NekoLogo
      $width={undefined}
      $height={undefined}
      style={{
        maxWidth: "300px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    />
  );
};
