import { ButtonProps } from "antd";
import Link from "next/link";
import { WSButton } from "./ws-button";

export const WSLinkButton = ({ children, href, ...props }: ButtonProps) => {
  return (
    <WSButton {...props}>
      <Link href={href || "#"}>{children}</Link>
    </WSButton>
  );
};
