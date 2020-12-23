import * as React from "react";
import styled from "styled-components";
import { Typography } from "antd";

const { Link } = Typography;

const SiteLink = styled(Link)`
  font-weight: bold;
`;

export const SupportedSites = () => {
  return (
    <ul>
      <li>
        <SiteLink href="https://www.youtube.com/" target="_blank">
          Youtube
        </SiteLink>
      </li>
      <li>
        <SiteLink href="https://www.nicovideo.jp/" target="_blank">
          niconico
        </SiteLink>
      </li>
      <li>
        <SiteLink href="https://vimeo.com/" target="_blank">
          Vimeo
        </SiteLink>
      </li>
      <li>
        <SiteLink href="https://www.bilibili.com/" target="_blank">
          bilibili
        </SiteLink>
      </li>
      <li>
        <SiteLink href="https://tver.jp/" target="_blank">
          TVer
        </SiteLink>
      </li>
    </ul>
  );
};
