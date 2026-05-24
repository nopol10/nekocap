import { colors } from "@/common/colors";
import { DEVICE } from "@/common/style-constants";
import { useTranslation } from "next-i18next";
import React, { ReactElement } from "react";
import styled from "styled-components";

const STATS = [
  { num: "24,891", key: "captions" },
  { num: "1,204", key: "contributors" },
  { num: "26", key: "languages" },
  { num: "3.2 M", key: "views" },
] as const;

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
  const { t } = useTranslation("common");
  return (
    <Section>
      <Grid>
        {STATS.map((stat) => (
          <StatItem key={stat.key}>
            <Num>{stat.num}</Num>
            <Lbl>{t(`home.stats.${stat.key}`)}</Lbl>
          </StatItem>
        ))}
      </Grid>
    </Section>
  );
};
