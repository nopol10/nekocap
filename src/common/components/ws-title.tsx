import React from "react";
import styled from "styled-components";
import { colors } from "../colors";
import { Typography } from "antd";
import { TitleProps } from "antd/lib/typography/Title";
import { DEVICE } from "../style-constants";

const { Title } = Typography;

type WSTitleProps = TitleProps & {
  textAlign?: string;
};

export const WSTitle = styled(({ textAlign, ...rest }: WSTitleProps) => {
  return <Title {...rest} />;
})`
  &.ant-typography {
    font-weight: 400;
    @media ${DEVICE.mobileOnly} {
      font-size: 1.4em;
    }
    em {
      font-weight: 600;
      font-style: normal;
    }
  }
  color: ${colors.darkText};
  text-align: ${({ textAlign = "left" }) => textAlign};
`;
