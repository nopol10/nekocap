import * as React from "react";
import { useSelector } from "react-redux";
import { userDataSelector } from "@/common/feature/login/selectors";
import styled from "styled-components";
import { NewProfileForm } from "@/common/feature/login/containers/new-profile-form";
import { routeNames } from "../../route-types";

const Page = styled.div`
  max-width: 800px;
  margin: 60px auto;
  background-color: white;
  padding: 40px;
`;

export const NewProfile = () => {
  const userData = useSelector(userDataSelector);
  if (!userData) {
    return null;
  }

  const handleSubmitSuccess = () => {
    window.location.href = routeNames.captioner.dashboard;
  };

  return (
    <Page>
      <NewProfileForm onSubmitSuccess={handleSubmitSuccess} />
    </Page>
  );
};
