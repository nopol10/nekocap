import { Layout } from "antd";
import styled from "styled-components";
import { colors } from "../colors";
import { DEVICE } from "../style-constants";

export type WSHeaderProps = {
  $scrolled?: boolean;
};

export const WSHeader = styled(Layout.Header)<WSHeaderProps>`
  &.ant-layout-header {
    position: fixed;
    width: 100%;
    top: 0;
    background: unset;
    background-color: transparent;
    ${({ $scrolled }) =>
      $scrolled ? `background-color: ${colors.white}` : ""};
    z-index: 10;
    padding: 0 16px;
    display: flex;
    flex-direction: row;
    transition: background-color 300ms;

    @media ${DEVICE.tablet} {
      line-height: 64px;
      padding: 0 50px;
      text-align: right;
    }
  }
`;
