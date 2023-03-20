import styled from "styled-components";

export const Expandable = styled.span`
  display: inline-block;
  transition: transform 300ms;
  transform: scale(1);

  :hover {
    transform: scale(1.15);
  }
`;
