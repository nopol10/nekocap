import styled from "styled-components";

export const WSSpace = styled.div<{
  $direction?: "horizontal" | "vertical";
  $size?: string;
}>`
  display: flex;
  flex-direction: ${({ $direction = "horizontal" }) =>
    $direction === "horizontal" ? "row" : "column"};
  gap: ${({ $size = "8px" }) => $size};
`;
