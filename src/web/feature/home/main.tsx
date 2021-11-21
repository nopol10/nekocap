import Layout from "antd/lib/layout";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { WSHeader } from "@/common/components/ws-header";
import { WSLayout } from "@/common/components/ws-layout";
import { WebHeader } from "./web-header";
import * as firebase from "firebase/app";
import "firebase/auth";

import { webAutoLogin } from "@/common/feature/login/actions";
import { useScrolledPastY } from "@/hooks";
import { initFirebase } from "@/extension/background/firebase";
import { AutoLoginContext } from "../common/contexts/auto-login-context";

const { Content } = Layout;

type MainProps = {
  children?: ReactNode;
};

export const Main = ({ children }: MainProps): JSX.Element => {
  const dispatch = useDispatch();
  // Keep track of whether an auto login has been attempted to prevent anoter auto login after the auto login
  const autoLoggedIn = useRef<boolean>(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState<boolean>(
    false
  );
  useEffect(() => {
    // Perform auto login if a user exists
    // Calling onAuthStateChanged at any time will always trigger the callback if a user exists,
    // even if the auth process completed before the addition of this callback
    initFirebase();
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.uid && !autoLoggedIn.current && !window.skipAutoLogin) {
        dispatch(webAutoLogin.request());
      }
      autoLoggedIn.current = true;
      setHasAttemptedAutoLogin(true);
    });
  }, []);

  const scrolled = useScrolledPastY(undefined, 174);

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
          <WSHeader scrolled={scrolled}>
            <WebHeader />
          </WSHeader>
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
