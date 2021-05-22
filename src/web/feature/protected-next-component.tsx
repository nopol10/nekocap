import React, { ReactNode, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isLoggedInSelector } from "@/common/feature/login/selectors";
import { captionerSelector } from "@/common/feature/captioner/selectors";
import { routeNames } from "./route-types";
import { Skeleton } from "antd";
import { useRouter } from "next/router";
import { webAutoLogin } from "@/common/feature/login/actions";
import { AutoLoginContext } from "./common/contexts/auto-login-context";

type ProtectedNextComponentProps = {
  children: JSX.Element;
};

const ProtectedNextComponent = ({ children }: ProtectedNextComponentProps) => {
  const isLoggedIn = useSelector(isLoggedInSelector);
  const captioner = useSelector(captionerSelector);
  const isLoggingIn = useSelector(webAutoLogin.isLoading(undefined));
  const router = useRouter();
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const hasAttemptedAutoLogin = useContext(AutoLoginContext);

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);
  useEffect(() => {
    if (!isClientLoaded || !hasAttemptedAutoLogin || isLoggingIn) {
      return;
    }
    if (hasAttemptedAutoLogin && !isLoggingIn && !isLoggedIn) {
      router.replace("/");
      return;
    }
    if (isLoggedIn && !captioner.captioner) {
      // Still loading captioner data
      return;
    }
    if (
      isClientLoaded &&
      !captioner.captioner.name &&
      router.pathname !== routeNames.profile.new
    ) {
      router.replace(routeNames.profile.new);
    }
  });

  if (isClientLoaded && isLoggedIn && captioner.captioner?.name) {
    return children;
  }

  return (
    <>
      {/* {!isClientLoaded || (isLoggedIn && !captioner.captioner) &&  */}
      <Skeleton active={true} />
      {/* } */}
    </>
  );
};

export default ProtectedNextComponent;
