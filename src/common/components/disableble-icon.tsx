import React from "react";
import { ReactNode } from "react";
import styled from "styled-components";

type DisablebleIconProps = {
  disabled?: boolean;
  children?: ReactNode;
};
export const DisablebleIcon = styled.div<DisablebleIconProps>`
  .anticon {
    opacity: ${({ disabled }: DisablebleIconProps) => (disabled ? 0.3 : 1)};
    pointer-events: ${({ disabled }: DisablebleIconProps) =>
      disabled ? "none" : "all"};
  }
`;
