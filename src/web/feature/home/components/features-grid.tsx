import captionDropdownImage from "@/assets/images/instructions/caption-dropdown.jpg";
import useEditorImage from "@/assets/images/instructions/use-editor.jpg";
import { colors } from "@/common/colors";
import { DEVICE } from "@/common/style-constants";
import DragOutlined from "@ant-design/icons/DragOutlined";
import StarOutlined from "@ant-design/icons/StarOutlined";
import ThunderboltOutlined from "@ant-design/icons/ThunderboltOutlined";
import Image from "next/image";
import React, { ReactElement, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Section = styled.section`
  padding: 88px 0;
  background: radial-gradient(ellipse at top, #fcfaf9 0%, #f3f6f8 100%);
`;

const Inner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;

  @media ${DEVICE.tablet} {
    padding: 0 40px;
  }
`;

const SectionHead = styled.div`
  text-align: center;
  max-width: 720px;
  margin: 0 auto 56px;
`;

const Eyebrow = styled.p`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${colors.base};
  font-weight: 600;
  margin-bottom: 16px;
`;

const H2 = styled.h2`
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 400;
  line-height: 1.2;
  color: #1a1a1a;
  margin: 0 0 20px;

  em {
    font-style: italic;
    color: ${colors.base};
  }
`;

const SubP = styled.p`
  font-size: 17px;
  line-height: 1.6;
  color: ${colors.text};
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media ${DEVICE.tablet} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 3px 4px 0 3px ${colors.alternate};
  }
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${colors.lightHighlight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: ${colors.base};
  flex-shrink: 0;
`;

const CardTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 10px;
`;

const CardDesc = styled.p`
  font-size: 15px;
  line-height: 1.55;
  color: ${colors.text};
  margin: 0;
`;

const VisualBox = styled.div`
  margin-top: auto;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
`;

const KARAOKE_CHARS = ["君", "の", "瞳", "の", "中"];

const KaraokeDemo = styled.div`
  background: #111;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 28px;
  font-weight: 700;
  min-height: 80px;
`;

const KarChar = styled.span<{ $lit: boolean }>`
  color: ${({ $lit }) => ($lit ? colors.alternate : "#555")};
  text-shadow: ${({ $lit }) =>
    $lit ? `0 0 12px ${colors.alternate}88` : "none"};
  transition:
    color 0.15s,
    text-shadow 0.15s;
`;

const KaraokeVisual = () => {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStep((s) => (s + 1) % KARAOKE_CHARS.length);
    }, 700);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <KaraokeDemo>
      {KARAOKE_CHARS.map((char, i) => (
        <KarChar key={i} $lit={i === step}>
          {char}
        </KarChar>
      ))}
    </KaraokeDemo>
  );
};

const EditorVisual = styled.div`
  background: #1f1f1f;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EditorPlayer = styled.div`
  position: relative;
  aspect-ratio: 16 / 8;
  background: #0a0a0a;
  border-radius: 4px;
  overflow: hidden;
`;

const EditorCaption = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
`;

const Timeline = styled.div`
  height: 36px;
  background: #333;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 4px;
  overflow: hidden;
`;

const CueBlock = styled.div<{ $width: number }>`
  height: 20px;
  width: ${({ $width }) => $width}%;
  background: ${colors.base};
  border-radius: 3px;
  flex-shrink: 0;
  opacity: 0.85;
`;

const PlayHead = styled.div`
  width: 2px;
  height: 28px;
  background: #fff;
  flex-shrink: 0;
  margin-left: 4px;
`;

const MiniEditorVisual = () => (
  <EditorVisual>
    <EditorPlayer>
      <Image
        src={useEditorImage.src}
        alt="Caption editor"
        fill
        style={{ objectFit: "cover", opacity: 0.6 }}
      />
      <EditorCaption>Hello, world!</EditorCaption>
    </EditorPlayer>
    <Timeline>
      <CueBlock $width={12} />
      <CueBlock $width={8} />
      <PlayHead />
      <CueBlock $width={15} />
      <CueBlock $width={6} />
      <CueBlock $width={10} />
    </Timeline>
  </EditorVisual>
);

export const FeaturesGrid = (): ReactElement => {
  return (
    <Section id="features">
      <Inner>
        <SectionHead>
          <Eyebrow>What NekoCap does</Eyebrow>
          <H2>
            A captioning toolkit that <em>respects</em> the player you&apos;re
            already in.
          </H2>
          <SubP>
            No re-uploads. No copies. Captions float over the original video,
            exactly where they belong, and they&apos;re written and reviewed by
            humans who love the content.
          </SubP>
        </SectionHead>

        <Grid>
          <Card>
            <IconWrap>
              <DragOutlined />
            </IconWrap>
            <div>
              <CardTitle>Captions in-player</CardTitle>
              <CardDesc>
                Install the extension, open a video, pick a caption from the
                dropdown above the player. It&apos;s the same place YouTube puts
                its own subtitles, so there&apos;s nothing new to learn.
              </CardDesc>
            </div>
            <VisualBox>
              <Image
                src={captionDropdownImage.src}
                alt="Caption dropdown in player"
                width={captionDropdownImage.width}
                height={captionDropdownImage.height}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </VisualBox>
          </Card>

          <Card>
            <IconWrap>
              <StarOutlined />
            </IconWrap>
            <div>
              <CardTitle>Advanced effects</CardTitle>
              <CardDesc>
                Renders Advanced Substation Alpha (SSA/ASS) via SubtitleOctopus,
                with karaoke timing, fades, positioning, and custom fonts. Good
                for music videos, anime, and fan-typeset releases.
              </CardDesc>
            </div>
            <KaraokeVisual />
          </Card>

          <Card>
            <IconWrap>
              <ThunderboltOutlined />
            </IconWrap>
            <div>
              <CardTitle>Convenient editor</CardTitle>
              <CardDesc>
                Time and translate from inside the player. Hotkeys for cue
                boundaries, drag the wave, custom positioning, instant preview.
                Export to SRT when you&apos;re done.
              </CardDesc>
            </div>
            <MiniEditorVisual />
          </Card>
        </Grid>
      </Inner>
    </Section>
  );
};
