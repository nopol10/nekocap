import styled from "styled-components";
import { colors } from "../colors";

type WarningTextProp = {
  $warn?: boolean;
};
export const WarningText = styled.div<WarningTextProp>`
  color: ${({ $warn }) => ($warn ? colors.captionWarning : colors.text)};
`;
