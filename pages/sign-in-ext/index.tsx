import { captionerSelector } from "@/common/feature/captioner/selectors";
import { FirebaseLoggedInUser } from "@/common/feature/login/types";
import type { UserData } from "@/common/providers/backend-provider";
import { STRING_CONSTANTS } from "@/common/string-constants";
import { ChromeExternalMessageType } from "@/common/types";
import { initFirebase } from "@/extension/background/firebase";
import { Main } from "@/web/feature/home/main";
import { NextWrapper } from "@/web/next-helpers/page-wrapper";
import { wrapper } from "@/web/store/store";
import { Typography } from "antd";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

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
    LoginState.Redirecting,
  );
  const [isNewParseUser, setIsNewParseUser] = useState(false);
  const captionerData = useSelector(captionerSelector);

  useEffect(() => {
    (async () => {
      const { auth } = initFirebase(getAuth);
      try {
        const authResult = await getRedirectResult(auth);
        if (authResult && authResult.user && auth.currentUser) {
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
            name: authResult.user.displayName || "unknown",
          };
          chrome.runtime.sendMessage(
            process.env.NEXT_PUBLIC_EXTENSION_ID || "",
            {
              type: ChromeExternalMessageType.GoogleAuthCredentials,
              payload: loggedInUserData,
            },
            (response: UserData) => {
              setLogInState(LoginState.Completed);
              setIsNewParseUser(!!response.isNewUser);
            },
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
  wrapper.getStaticProps(() => async ({ locale = "en-US" }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, TRANSLATION_NAMESPACES)),
      },
    };
  }),
);
