import React, { ReactElement } from "react";
import styled, { keyframes } from "styled-components";
import { colors } from "@/common/colors";

const SITES = [
  { name: "YouTube", color: "#FF0033" },
  { name: "Vimeo", color: "#19B7EA" },
  { name: "niconico", color: "#252525" },
  { name: "bilibili", color: "#FB7299" },
  { name: "bilibili.tv", color: "#FB7299" },
  { name: "TVer", color: "#F39800" },
  { name: "Netflix", color: "#E50914" },
  { name: "Twitch", color: "#9146FF" },
  { name: "Dailymotion", color: "#0066DC" },
  { name: "TikTok", color: "#111111" },
  { name: "WeTV", color: "#00a3e0" },
  { name: "iQiyi", color: "#00be06" },
];

const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const Section = styled.section`
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  padding: 28px 0;
  overflow: hidden;
`;

const Label = styled.p`
  text-align: center;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${colors.text};
  margin-bottom: 20px;
  opacity: 0.7;
`;

const Marquee = styled.div`
  overflow: hidden;
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 8%,
    #000 92%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent,
    #000 8%,
    #000 92%,
    transparent
  );

  &:hover .marquee-track {
    animation-play-state: paused;
  }
`;

const Track = styled.div`
  display: flex;
  gap: 32px;
  width: max-content;
  animation: ${scroll} 28s linear infinite;
`;

const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  padding: 10px 22px;
  background: #fff;
  border-radius: 999px;
  border: 1px solid #e8e8e8;
  white-space: nowrap;
  color: #1a1a1a;
`;

const Swatch = styled.span<{ $color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const SitesMarquee = (): ReactElement => {
  const doubled = [...SITES, ...SITES];

  return (
    <Section>
      <Label>Captions appear right inside the player on</Label>
      <Marquee>
        <Track className="marquee-track">
          {doubled.map((site, i) => (
            <Chip key={`${site.name}-${i}`}>
              <Swatch $color={site.color} />
              {site.name}
            </Chip>
          ))}
        </Track>
      </Marquee>
    </Section>
  );
};
