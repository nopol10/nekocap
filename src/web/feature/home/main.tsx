import { WSHeader } from "@/common/components/ws-header";
import { WSLayout } from "@/common/components/ws-layout";
import { useIsClient, useScrolledPastY } from "@/hooks";
import { Layout } from "antd";
import { ReactNode } from "react";
import { AutoLoginProvider } from "../common/contexts/auto-login-context";
import { WebHeader } from "./web-header";

const { Content } = Layout;

type MainProps = {
  children?: ReactNode;
  withLoggedInUserCaptions?: boolean;
};

export const Main = ({
  children,
  withLoggedInUserCaptions = false,
}: MainProps): JSX.Element => {
  const scrolled = useScrolledPastY(undefined, 174);
  const isClient = useIsClient();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <WSLayout
        style={{
          minHeight: "100%",
        }}
      >
        <WSLayout>
          {isClient && (
            <WSHeader $scrolled={scrolled}>
              <WebHeader />
            </WSHeader>
          )}
          <Content
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "64px",
              height: "100%",
            }}
          >
            <AutoLoginProvider
              withLoggedInUserCaptions={withLoggedInUserCaptions}
            >
              {children}
            </AutoLoginProvider>
          </Content>
        </WSLayout>
      </WSLayout>
    </div>
  );
};
