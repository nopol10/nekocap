import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { userExtensionPreferenceSelector } from "@/background/feature/user-extension-preference/selectors";
import { Switch } from "antd";
import { setHideToolbarIfNoCaptions } from "@/background/feature/user-extension-preference/actions";
import { colors } from "@/common/colors";

const Wrapper = styled.div`
  border-top: 1px solid ${colors.divider};
  margin: 20px 0;
  padding-top: 20px;

  h2 {
    font-size: 16px;
    margin-bottom: 5px;
  }
`;

const FieldLabel = styled.div`
  margin-right: 10px;
  font-size: 14px;
`;

const SwitchField = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const FieldControl = styled.div``;

export const ExtensionPreferences = () => {
  const dispatch = useDispatch();
  const { hideToolbarIfNoCaptions } = useSelector(
    userExtensionPreferenceSelector
  );

  const handleChangeHideToolbarIfNoCaptions = (checked: boolean) => {
    dispatch(setHideToolbarIfNoCaptions(checked));
  };

  return (
    <Wrapper>
      <h2>Settings</h2>
      <SwitchField>
        <FieldLabel>Hide toolbar if no captions are found</FieldLabel>
        <FieldControl>
          <Switch
            defaultChecked={hideToolbarIfNoCaptions}
            onChange={handleChangeHideToolbarIfNoCaptions}
          />
        </FieldControl>
      </SwitchField>
    </Wrapper>
  );
};
