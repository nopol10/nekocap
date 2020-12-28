import { Tooltip } from "antd";
import Button, { ButtonProps } from "antd/lib/button";
import { TooltipProps } from "antd/lib/tooltip";
import React, { ReactNode } from "react";
import styled, { css } from "styled-components";
import { darkModeSelector } from "../processor-utils";
import { colors } from "@/common/colors";

export const WSButton = styled(Button)`
  ${darkModeSelector(css`
    color: ${colors.white};
    background: transparent;
  `)}
`;

type ButtonWithTooltipProps = {
  title: string;
  onClick?: (event: React.MouseEvent) => void;
  buttonProps?: Partial<ButtonProps>;
  tooltipProps?: Partial<TooltipProps>;
  children?: ReactNode;
};

export const ButtonWithTooltip = ({
  buttonProps,
  title,
  tooltipProps,
  onClick,
  children,
}: ButtonWithTooltipProps) => {
  return (
    <Tooltip title={title} {...tooltipProps}>
      <WSButton onClick={onClick} {...buttonProps}>
        {children}
      </WSButton>
    </Tooltip>
  );
};
