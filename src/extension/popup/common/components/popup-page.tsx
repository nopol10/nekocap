import { colors } from "@/common/colors";
import styled from "styled-components";

export const PopupPage = styled.div<{ width?: string }>`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 20px;
  min-height: 400px;
  background-color: white;
  width: ${(props) => props.width || "500px"};

  @media (prefers-color-scheme: dark) {
    background-color: ${colors.backgroundDark};
    color: ${colors.textDark};
  }
`;
