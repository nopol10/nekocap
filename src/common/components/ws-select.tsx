import { colors } from "@/common/colors";
import { Select } from "antd";
import styled from "styled-components";
import { darkModeSelector } from "../processor-utils";

export const WSSelect = styled(Select)`
  ${darkModeSelector(`
    .ant-select-selector {
      color: ${colors.white};
      background: transparent;
    }
    .ant-select-arrow {
      color: ${colors.white};
    }
  `)}
`;
