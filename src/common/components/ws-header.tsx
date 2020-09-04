import Layout from "antd/lib/layout";
import styled from "styled-components";
import { colors } from "../colors";

export const WSHeader = styled(Layout.Header)`
  &.ant-layout-header {
    position: fixed;
    width: 100%;
    top: 0;
    display: flex;
    flex-direction: row;
    text-align: right;
    background: unset;
    background-color: ${colors.white};
    z-index: 10;
  }
`;
