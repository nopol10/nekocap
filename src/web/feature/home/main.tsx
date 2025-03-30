import { WSHeader } from "@/common/components/ws-header";
import { WSLayout } from "@/common/components/ws-layout";
import { webAutoLogin } from "@/common/feature/login/actions";
import { initFirebase } from "@/extension/background/firebase";
import { useIsClient, useScrolledPastY } from "@/hooks";
import { Layout } from "antd";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AutoLoginContext } from "../common/contexts/auto-login-context";
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
  const dispatch = useDispatch();
  // Keep track of whether an auto login has been attempted to prevent anoter auto login after the auto login
  const autoLoggedIn = useRef<boolean>(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] =
    useState<boolean>(false);
  useEffect(() => {
    // Perform auto login if a user exists
    // Calling onAuthStateChanged at any time will always trigger the callback if a user exists,
    // even if the auth process completed before the addition of this callback
    const { auth } = initFirebase(getAuth);
    onAuthStateChanged(auth, (user) => {
      if (user && user.uid && !autoLoggedIn.current && !window.skipAutoLogin) {
        dispatch(
          webAutoLogin.request({ withCaptions: withLoggedInUserCaptions }),
        );
      }
      autoLoggedIn.current = true;
      setHasAttemptedAutoLogin(true);
    });
  }, []);

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
            <WSHeader scrolled={scrolled}>
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
            <AutoLoginContext.Provider value={hasAttemptedAutoLogin}>
              {children}
            </AutoLoginContext.Provider>
          </Content>
        </WSLayout>
      </WSLayout>
    </div>
  );
};
