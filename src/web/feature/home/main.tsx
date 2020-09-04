import Layout from "antd/lib/layout";
import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { WSHeader } from "@/common/components/ws-header";
import { WSLayout } from "@/common/components/ws-layout";
import { Routes } from "../routes";
import "./home.scss";
import { WebHeader } from "./web-header";
import * as firebase from "firebase/app";
import "firebase/auth";

import { webAutoLogin } from "@/common/feature/login/actions";

const { Content } = Layout;

export const Main = () => {
  const dispatch = useDispatch();
  // Keep track of whether an auto login has been attempted to prevent anoter auto login after the auto login
  const autoLoggedIn = useRef<boolean>(false);
  useEffect(() => {
    // Perform auto login if a user exists
    // Calling onAuthStateChanged at any time will always trigger the callback if a user exists,
    // even if the auth process completed before the addition of this callback
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.uid && !autoLoggedIn.current) {
        dispatch(webAutoLogin.request());
      }
      autoLoggedIn.current = true;
    });
  }, []);

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
          <WSHeader>
            <WebHeader />
          </WSHeader>
          <Content
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "64px",
            }}
          >
            <Routes />
          </Content>
        </WSLayout>
      </WSLayout>
    </div>
  );
};
