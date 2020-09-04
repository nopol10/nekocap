import styled from "styled-components";
import { colors } from "../colors";

type WarningTextProp = {
  warn?: boolean;
};
export const WarningText = styled("div").withConfig<WarningTextProp>({
  shouldForwardProp: (prop, defPropValFn) => !["warn"].includes(prop),
})`
  color: ${({ warn }) => (warn ? colors.captionWarning : colors.darkText)};
`;
