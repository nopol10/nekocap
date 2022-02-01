import Head from "next/head";
import React, { useEffect, useState } from "react";
import * as firebase from "firebase/app";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { wrapper } from "@/web/store/store";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { GetStaticProps } from "next";
import { Main } from "@/web/feature/home/main";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { initFirebase } from "@/extension/background/firebase";
import Title from "antd/lib/typography/Title";
import Text from "antd/lib/typography/Text";
import { ChromeExternalMessageType } from "@/common/types";
import { FirebaseLoggedInUser } from "@/common/feature/login/types";

const TRANSLATION_NAMESPACES = ["common"];

export default function ExtensionSignInPage(): JSX.Element {
  const metaTitle = "NekoCap - Extension Sign In";
  const metaDescription = STRING_CONSTANTS.metaDescription;
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      initFirebase();
      try {
        const authResult = await firebase.auth().getRedirectResult();
        if (authResult && authResult.user) {
          const idToken = await firebase.auth().currentUser.getIdToken();
          const loggedInUserData: FirebaseLoggedInUser = {
            id: authResult.user.uid,
            credentialIdToken:
              // @ts-ignore
              authResult.credential.idToken ||
              // @ts-ignore
              authResult.credential.oauthIdToken,
            idToken,
            name: authResult.user.displayName,
          };
          setLoggedIn(true);
          chrome.runtime.sendMessage(
            process.env.NEXT_PUBLIC_EXTENSION_ID,
            {
              type: ChromeExternalMessageType.GoogleAuthCredentials,
              payload: loggedInUserData,
            },
            (response) => {
              console.log("Response", response);
            }
          );
          return;
        }
      } catch (error) {
        console.log("Error getting auth result", error);
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithRedirect(provider);
    })();
  }, []);

  return (
    <>
      <Head>
        <>
          <title>{metaTitle}</title>
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:site" content="@NekoCaption"></meta>
        </>
      </Head>
      {loggedIn && (
        <Main>
          <div
            style={{
              marginTop: "40px",
              padding: "0px 40px",
              overflowX: "hidden",
            }}
          >
            <Title>Sign in complete</Title>
            <Text>You can close this page now</Text>
          </div>
        </Main>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = NextWrapper.getStaticProps(
  wrapper.getStaticProps(() => async ({ locale }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
      revalidate: 60,
    };
  })
);
