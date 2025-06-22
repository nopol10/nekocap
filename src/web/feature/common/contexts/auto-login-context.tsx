import { webAutoLogin } from "@/common/feature/login/actions";
import { initFirebase } from "@/extension/background/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

export const AutoLoginContext = createContext(false);

export const AutoLoginProvider = ({
  children,
  withLoggedInUserCaptions,
}: React.PropsWithChildren<{
  withLoggedInUserCaptions: boolean;
}>) => {
  const [hasAttemptedAutoLogin] = useAutoLogin({ withLoggedInUserCaptions });
  return (
    <AutoLoginContext.Provider value={hasAttemptedAutoLogin}>
      {children}
    </AutoLoginContext.Provider>
  );
};

export function useAutoLogin({
  withLoggedInUserCaptions,
}: {
  withLoggedInUserCaptions: boolean;
}) {
  const dispatch = useDispatch();

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
  }, [dispatch, withLoggedInUserCaptions]);
  return [hasAttemptedAutoLogin] as const;
}
