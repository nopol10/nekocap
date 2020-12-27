import { Select } from "antd";
import styled, { css } from "styled-components";
import { darkModeSelector } from "../processor-utils";
import { colors } from "@/common/colors";

export const WSSelect = styled(Select)`
  ${darkModeSelector(css`
    .ant-select-selector {
      color: ${colors.white};
      background: transparent;
    }
    .ant-select-arrow {
      color: ${colors.white};
    }
  `)}
`;
