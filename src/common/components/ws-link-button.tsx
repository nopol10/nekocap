import { Tooltip } from "antd";
import Button, { ButtonProps } from "antd/lib/button";
import { TooltipProps } from "antd/lib/tooltip";
import React, { ReactNode } from "react";
import { colors } from "@/common/colors";
import { WSButton } from "./ws-button";
import Link from "next/link";

export const WSLinkButton = ({ children, href, ...props }: ButtonProps) => {
  return (
    <WSButton {...props}>
      <Link href={href}>{children}</Link>
    </WSButton>
  );
};
