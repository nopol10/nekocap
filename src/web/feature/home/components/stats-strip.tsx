import { colors } from "@/common/colors";
import { DEVICE } from "@/common/style-constants";
import React, { ReactElement } from "react";
import styled from "styled-components";

const STATS = [
  { num: "24,891", lbl: "captions published" },
  { num: "1,204", lbl: "contributors" },
  { num: "26", lbl: "languages" },
  { num: "3.2 M", lbl: "caption views" },
];

const Section = styled.section`
  position: relative;
  background: linear-gradient(135deg, ${colors.base} 0%, #ff8c0a 100%);
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: -60px;
    right: -80px;
    width: 360px;
    height: 360px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      ${colors.alternate}59 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 36px 24px;

  @media ${DEVICE.tablet} {
    grid-template-columns: repeat(4, 1fr);
    padding: 36px 40px;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const Num = styled.div`
  font-size: 36px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  margin-bottom: 8px;
`;

const Lbl = styled.div`
  font-size: 13px;
  color: #fff;
  opacity: 0.9;
`;

export const StatsStrip = (): ReactElement => {
  return (
    <Section>
      <Grid>
        {STATS.map((stat) => (
          <StatItem key={stat.lbl}>
            <Num>{stat.num}</Num>
            <Lbl>{stat.lbl}</Lbl>
          </StatItem>
        ))}
      </Grid>
    </Section>
  );
};
