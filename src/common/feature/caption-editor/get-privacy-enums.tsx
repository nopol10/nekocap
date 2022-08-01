import { Select } from "antd";
import React from "react";

import { CaptionPrivacy } from "../video/types";

export const getPrivacyEnums = () => {
  const options = Object.values(CaptionPrivacy)
    .filter((v) => !isNaN(Number(v)))
    .map((privacyOption) => {
      return (
        <Select.Option key={privacyOption} value={privacyOption}>
          {CaptionPrivacy[privacyOption]}
        </Select.Option>
      );
    });
  return options;
};
