import Head from "next/head";
import React, { useEffect, useState } from "react";
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
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
import type { UserData } from "@/common/providers/backend-provider";
import { useSelector } from "react-redux";
import { profileSelector } from "@/common/feature/profile/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";

const TRANSLATION_NAMESPACES = ["common"];

enum LoginState {
  Redirecting,
  Authed, // Authed with provider (google) but not with our backend
  Completed,
}

export default function ExtensionSignInPage(): JSX.Element {
  const metaTitle = "NekoCap - Extension Sign In";
  const metaDescription = STRING_CONSTANTS.metaDescription;
  const [loginState, setLogInState] = useState<LoginState>(
    LoginState.Redirecting
  );
  const [isNewParseUser, setIsNewParseUser] = useState(false);
  const captionerData = useSelector(captionerSelector);

  useEffect(() => {
    (async () => {
      const { auth } = initFirebase();
      try {
        const authResult = await getRedirectResult(auth);
        if (authResult && authResult.user) {
          setLogInState(LoginState.Authed);
          const idToken = await auth.currentUser.getIdToken();
          const loggedInUserData: FirebaseLoggedInUser = {
            id: authResult.user.uid,
            credentialIdToken:
              // @ts-ignore
              authResult._tokenResponse?.oauthIdToken ||
              // @ts-ignore
              authResult.credential?.idToken ||
              // @ts-ignore
              authResult.credential?.oauthIdToken,
            idToken,
            name: authResult.user.displayName,
          };
          chrome.runtime.sendMessage(
            process.env.NEXT_PUBLIC_EXTENSION_ID,
            {
              type: ChromeExternalMessageType.GoogleAuthCredentials,
              payload: loggedInUserData,
            },
            (response: UserData) => {
              setLogInState(LoginState.Completed);
              setIsNewParseUser(!!response.isNewUser);
            }
          );
          return;
        }
      } catch (error) {
        console.log("Error getting auth result", error);
      }

      const provider = new GoogleAuthProvider();
      signInWithRedirect(auth, provider);
    })();
  }, []);
  const needsProfileSetup = isNewParseUser || !captionerData?.captioner?.name;

  let title = "",
    description = "";
  switch (loginState) {
    case LoginState.Authed:
      title = "Logging in...";
      description = "Please wait...";
      break;
    case LoginState.Completed:
      title = "Sign in complete";
      description = needsProfileSetup
        ? "Before you proceed, open the extension again to fill in your profile! You can close this page afterwards."
        : "You can close this page now.";
      break;
    case LoginState.Redirecting:
    default:
      title = "Redirecting to sign-in page";
      description = "Please wait...";
      break;
  }

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
      {
        <Main>
          <div
            style={{
              marginTop: "40px",
              padding: "0px 40px",
              overflowX: "hidden",
            }}
          >
            <Title>{title}</Title>
            <Text>{description}</Text>
          </div>
        </Main>
      }
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
