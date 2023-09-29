import * as React from "react";
import styled from "styled-components";
import { Typography } from "antd";

const { Link } = Typography;

const SiteLink = styled(Link)`
  font-weight: bold;
`;

type SupportedSite = {
  url: string;
  name: string;
};

const SUPPORTED_SITES: SupportedSite[] = [
  {
    url: "https://www.youtube.com/",
    name: "YouTube",
  },
  {
    url: "https://www.nicovideo.jp/",
    name: "niconico",
  },
  {
    url: "https://vimeo.com/",
    name: "Vimeo",
  },
  {
    url: "https://www.bilibili.com/",
    name: "bilibili",
  },
  {
    url: "https://bilibili.tv/",
    name: "bilibili.tv",
  },
  {
    url: "https://tver.jp/",
    name: "TVer",
  },
  {
    url: "https://www.netflix.com/",
    name: "Netflix",
  },
  {
    url: "https://www.twitter.com/",
    name: "Twitter",
  },
  {
    url: "https://www.wetv.vip/",
    name: "WeTV",
  },
  {
    url: "https://www.tiktok.com/",
    name: "TikTok",
  },
  {
    url: "https://iq.com/",
    name: "iQiyi",
  },
  {
    url: "https://abema.tv/",
    name: "Abema",
  },
  {
    url: "https://www.dailymotion.com/",
    name: "Dailymotion",
  },
  {
    url: "https://cu.tbs.co.jp/",
    name: "TBS Free",
  },
  {
    url: "https://nogidoga.com/",
    name: "NogiDoga",
  },
];

export const SupportedSites = () => {
  return (
    <ul
      style={{
        paddingInlineStart: 0,
        display: "inline-flex",
        flexWrap: "wrap",
        columnGap: "8px",
      }}
    >
      {SUPPORTED_SITES.map((site, index) => {
        const isLast = index === SUPPORTED_SITES.length - 1;
        return (
          <li key={site.url} style={{ display: "inline-block" }}>
            <SiteLink href={site.url} target="_blank" rel="noreferrer">
              {site.name}
            </SiteLink>
            {!isLast && <span>・</span>}
          </li>
        );
      })}
    </ul>
  );
};
