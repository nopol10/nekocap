import Select from "antd/lib/select";
import React from "react";
import { languages } from "./languages";

export const generateCustomLanguageOptions = (
  languageNameFilter?: (name: string) => string
) => {
  return [
    ...Object.keys(languages).map((languageId) => {
      const languageName = languages[languageId];
      return (
        <Select.Option key={languageId} value={languageId}>
          {languageNameFilter ? languageNameFilter(languageName) : languageName}
        </Select.Option>
      );
    }),
  ];
};

export const languageOptions = generateCustomLanguageOptions();
