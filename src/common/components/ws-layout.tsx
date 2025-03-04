import { Layout, LayoutProps } from "antd";
import styled from "styled-components";
import { colors } from "../colors";

type WSLayoutProps = LayoutProps & {
  contentColor?: string;
};

export const WSLayout = styled(({ contentColor, ...rest }: WSLayoutProps) => {
  return <Layout {...rest} />;
})`
  & > .ant-layout-content {
  }

  & > .ant-layout-header {
  }
  & > .ant-layout-sider {
    background-color: ${colors.white};
  }
`;
