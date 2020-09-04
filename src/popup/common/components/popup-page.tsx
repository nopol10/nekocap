import styled from "styled-components";
import { colors } from "@/common/colors";

export const PopupPage = styled.div<{ width?: string }>`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 20px;
  min-height: 400px;
  background-color: white;
  width: ${(props) => props.width || "300px"};
`;
