import { Tooltip } from "antd";
import Button, { ButtonProps } from "antd/lib/button";
import { TooltipProps } from "antd/lib/tooltip";
import React, { ReactNode } from "react";
import styled from "styled-components";

export const WSButton = styled(Button)``;

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
      <Button onClick={onClick} {...buttonProps}>
        {children}
      </Button>
    </Tooltip>
  );
};
