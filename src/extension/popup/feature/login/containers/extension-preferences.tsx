import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { userExtensionPreferenceSelector } from "@/extension/background/feature/user-extension-preference/selectors";
import { Select, Switch } from "antd";
import {
  setAutoloadMethod,
  setHideToolbarIfNoCaptions,
  setPreferredLanguage,
} from "@/extension/background/feature/user-extension-preference/actions";
import { colors } from "@/common/colors";
import { useEffect, useState } from "react";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { WSButton } from "@/common/components/ws-button";
import { openMenuBar } from "@/common/feature/video/actions";
import { languageOptions } from "@/common/language-utils";
import { AutoloadMethod } from "@/extension/background/feature/user-extension-preference/types";
import { languages } from "@/common/languages";

const Wrapper = styled.div`
  margin: 20px 0;

  h2 {
    font-size: 16px;
    margin-bottom: 5px;
  }
`;

const FieldLabel = styled.div`
  margin-right: 10px;
  font-size: 14px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${colors.divider}6b;
  }
`;

const FieldControl = styled.div``;

const autoLoadOptions: { [key in AutoloadMethod]: string } = {
  [AutoloadMethod.NoAutoload]: "Do not autoload",
  [AutoloadMethod.AutoloadPreferredOnly]: "Preferred language only",
  [AutoloadMethod.AutoloadPreferredOrFirst]:
    "Preferred language or first caption",
};

export const ExtensionPreferences = () => {
  const dispatch = useDispatch();
  const [tabId, setTabId] = useState(0);
  const {
    hideToolbarIfNoCaptions,
    autoloadMethod,
    preferredLanguage,
  } = useSelector(userExtensionPreferenceSelector);

  const tabData = useSelector(tabVideoDataSelector(tabId));

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setTabId(tabs[0].id);
    });
  }, []);

  const handleChangeHideToolbarIfNoCaptions = (checked: boolean) => {
    dispatch(setHideToolbarIfNoCaptions(checked));
  };

  const handleClickShowMenu = () => {
    dispatch(openMenuBar({ tabId: tabId }));
  };

  const handleSelectAutoloadMethod = (method: AutoloadMethod) => {
    dispatch(setAutoloadMethod(method));
  };

  const handleSelectPreferredLanguage = (
    languageCode: keyof typeof languages | "none"
  ) => {
    dispatch(setPreferredLanguage(languageCode));
  };

  return (
    <Wrapper>
      <h2>Settings</h2>
      {tabData && tabData.menuHidden && (
        <Field>
          <FieldLabel>Menu currently hidden</FieldLabel>
          <WSButton onClick={handleClickShowMenu}>Show</WSButton>
        </Field>
      )}
      <Field>
        <FieldLabel>Hide toolbar if no captions are found</FieldLabel>
        <FieldControl>
          <Switch
            defaultChecked={hideToolbarIfNoCaptions}
            onChange={handleChangeHideToolbarIfNoCaptions}
          />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel>Auto-load captions</FieldLabel>
        <FieldControl>
          <Select
            style={{ width: 250 }}
            value={autoloadMethod}
            onSelect={handleSelectAutoloadMethod}
          >
            {Object.keys(autoLoadOptions).map((key) => {
              return (
                <Select.Option
                  key={`autoload-option-${key}`}
                  value={parseInt(key)}
                >
                  {autoLoadOptions[key]}
                </Select.Option>
              );
            })}
          </Select>
        </FieldControl>
      </Field>
      {autoloadMethod != AutoloadMethod.NoAutoload && (
        <Field>
          <FieldLabel>Autoload language</FieldLabel>
          <FieldControl>
            <Select
              style={{ width: 250 }}
              value={preferredLanguage}
              onSelect={handleSelectPreferredLanguage}
            >
              <Select.Option key={"none"} value={"none"}>
                {"None"}
              </Select.Option>
              {languageOptions}
            </Select>
          </FieldControl>
        </Field>
      )}
    </Wrapper>
  );
};
