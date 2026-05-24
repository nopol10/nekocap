import { colors } from "@/common/colors";
import { CaptionListFields } from "@/common/feature/video/types";
import {
  baseLanguages,
  getBaseLanguageCode,
  languages,
} from "@/common/languages";
import { DEVICE } from "@/common/style-constants";
import { Spin } from "antd";
import React, { ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { CaptionTile } from "./caption-tile";

const Section = styled.section`
  background: linear-gradient(180deg, ${colors.white} 0%, #f6f1ea 100%);
  padding: 80px 0;
`;

const Inner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;

  @media ${DEVICE.tablet} {
    padding: 0 40px;
  }
`;

const RailHead = styled.div`
  margin-bottom: 28px;
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 8px;

  span {
    color: ${colors.base};
  }
`;

const Sub = styled.p`
  font-size: 14px;
  color: ${colors.secondary};
  margin: 0;
`;

const PillsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
`;

const Pill = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? colors.base : "#d0d0d0")};
  background: ${({ $active }) => ($active ? colors.base : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : colors.text)};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: ${colors.base};
    color: ${({ $active }) => ($active ? "#fff" : colors.base)};
  }
`;

const CaptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media ${DEVICE.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  @media ${DEVICE.desktop} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const LoadingBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const EmptyCard = styled.div`
  border: 2px dashed #d0d0d0;
  border-radius: 12px;
  padding: 40px 32px;
  text-align: center;
  color: ${colors.text};
  font-size: 15px;
  line-height: 1.6;
  grid-column: 1 / -1;
`;

type YourLangRailProps = {
  captions: CaptionListFields[];
  isLoading: boolean;
  langOverride?: string | null;
};

export const YourLangRail = ({
  captions,
  isLoading,
  langOverride,
}: YourLangRailProps): ReactElement => {
  const [activeLang, setActiveLang] = useState<string>("");
  const [detectedLang, setDetectedLang] = useState<string>("");

  useEffect(() => {
    const nav =
      langOverride ??
      (typeof navigator !== "undefined" ? navigator.language : "en");
    const base = getBaseLanguageCode(nav);
    setDetectedLang(base);
    setActiveLang(base);
  }, [langOverride]);

  const availableLangs = Array.from(
    new Set(captions.map((c) => getBaseLanguageCode(c.language))),
  ).slice(0, 8);

  const effectiveLang = activeLang || detectedLang;

  const filtered = captions.filter(
    (c) => getBaseLanguageCode(c.language) === effectiveLang,
  );

  const activeLangName =
    languages[effectiveLang] || baseLanguages[effectiveLang] || effectiveLang;

  return (
    <Section>
      <Inner>
        <RailHead>
          <Heading>
            In <span>{activeLangName}</span>, captions you can watch right now
          </Heading>
          <Sub>Auto-detected from your browser</Sub>
        </RailHead>

        {availableLangs.length > 1 && (
          <PillsRow>
            {availableLangs.map((lang) => (
              <Pill
                key={lang}
                $active={lang === effectiveLang}
                onClick={() => setActiveLang(lang)}
              >
                {languages[lang] || baseLanguages[lang] || lang}
              </Pill>
            ))}
          </PillsRow>
        )}

        <CaptionsGrid>
          {isLoading ? (
            <LoadingBox>
              <Spin size="large" />
            </LoadingBox>
          ) : filtered.length > 0 ? (
            filtered
              .slice(0, 6)
              .map((caption) => (
                <CaptionTile key={caption.id} caption={caption} />
              ))
          ) : (
            <EmptyCard>
              No captions in {activeLangName} yet. Be the first to add one,
              install the extension and start a caption on a video without one.
            </EmptyCard>
          )}
        </CaptionsGrid>
      </Inner>
    </Section>
  );
};
