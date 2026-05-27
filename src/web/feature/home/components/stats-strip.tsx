import { colors } from "@/common/colors";
import { formatCompactViews, formatThousands } from "@/common/format";
import { useHomepageStats } from "@/common/hooks/use-homepage-stats";
import { DEVICE } from "@/common/style-constants";
import { useTranslation } from "next-i18next";
import { ReactElement } from "react";
import styled from "styled-components";

const STAT_KEYS = ["captions", "contributors", "languages", "views"] as const;
type StatKey = (typeof STAT_KEYS)[number];
const PLACEHOLDER = "—";

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
  const { data: stats } = useHomepageStats();

  const values: Record<StatKey, string> = {
    captions: stats ? formatThousands(stats.totalCaptions) + "+" : PLACEHOLDER,
    contributors: stats
      ? formatThousands(stats.totalCaptioners) + "+"
      : PLACEHOLDER,
    languages: stats ? formatThousands(stats.totalLanguages) : PLACEHOLDER,
    views: stats ? formatCompactViews(stats.totalViews) + "+" : PLACEHOLDER,
  };

  return (
    <Section>
      <Grid>
        {STAT_KEYS.map((key) => (
          <StatItem key={key}>
            <Num>{values[key]}</Num>
            <Lbl>{t(`home.stats.${key}`)}</Lbl>
          </StatItem>
        ))}
      </Grid>
    </Section>
  );
};
