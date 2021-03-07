import Layout from "antd/lib/layout";
import styled from "styled-components";
import { colors } from "../colors";
import { DEVICE } from "../style-constants";
import { styledNoPass } from "../style-utils";

export type WSHeaderProps = {
  scrolled?: boolean;
};

export const WSHeader = styledNoPass<WSHeaderProps, typeof Layout.Header>(
  Layout.Header
)`
  &.ant-layout-header {
    position: fixed;
    width: 100%;
    top: 0;
    background: unset;
    background-color: "transparent";
    ${({ scrolled }) => (scrolled ? `background-color: ${colors.white}` : "")};
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
