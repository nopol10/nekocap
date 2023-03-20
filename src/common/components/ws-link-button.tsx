import { ButtonProps } from "antd/lib/button";
import React from "react";
import { WSButton } from "./ws-button";
import Link from "next/link";

export const WSLinkButton = ({ children, href, ...props }: ButtonProps) => {
  return (
    <WSButton {...props}>
      <Link href={href || "#"}>{children}</Link>
    </WSButton>
  );
};
