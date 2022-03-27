import styled from "styled-components";
import { Typography } from "antd";
import { DEVICE } from "../style-constants";

const { Text } = Typography;

export const WSText = styled(Text)`
  &.ant-typography {
    display: inline-block;
    font-weight: 400;
    @media ${DEVICE.mobileOnly} {
      font-size: 0.8em;
      line-height: 1.5;
    }
  }
`;
