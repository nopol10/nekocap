import * as React from "react";
import { useSelector } from "react-redux";
import { userDataSelector } from "@/common/feature/login/selectors";
import styled from "styled-components";
import { NewProfileForm } from "@/common/feature/login/containers/new-profile-form";
import { routeNames } from "../../route-types";
import { useRouter } from "next/router";

const Page = styled.div`
  max-width: 800px;
  margin: 60px auto;
  background-color: white;
  padding: 40px;
`;

export const NewProfile = () => {
  const userData = useSelector(userDataSelector);
  const router = useRouter();

  if (!userData) {
    return null;
  }

  const handleSubmitSuccess = () => {
    router.push(routeNames.captioner.dashboard);
  };

  return (
    <Page>
      <NewProfileForm onSubmitSuccess={handleSubmitSuccess} />
    </Page>
  );
};
