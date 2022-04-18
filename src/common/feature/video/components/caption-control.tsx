import * as React from "react";
import { VideoPlayerPreferences } from "@/common/feature/video/types";
import { colors } from "@/common/colors";
import Slider from "antd/lib/slider";
import FontSizeOutlined from "@ant-design/icons/lib/icons/FontSizeOutlined";
import { ReactNode, useCallback } from "react";
import { styledNoPass } from "@/common/style-utils";
import CaretUpOutlined from "@ant-design/icons/lib/icons/CaretUpOutlined";
import CaretDownOutlined from "@ant-design/icons/lib/icons/CaretDownOutlined";
import { useToggle } from "@/hooks";

const Wrapper = styledNoPass<{ fullScreen: boolean; isHidden: boolean }>("div")`
  display: ${({ isHidden, fullScreen }) =>
    isHidden && fullScreen ? "none" : "flex"};
  flex-direction: row;
  align-items: center;
  position: relative;
  padding: 10px 0px 10px 20px;
  background-color: ${colors.captionControlBackground};
  border-top: 1px solid ${colors.captionControlBorder};
`;

const Hider = styledNoPass<{ fullScreen: boolean; isHidden: boolean }>("div")`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 30px;
  top: -29px;
  right: 0;
  color: ${colors.white};
  border-top: 1px solid ${colors.captionControlBorder};
  border-left: 1px solid ${colors.captionControlBorder};
  border-right: 1px solid ${colors.captionControlBorder};
  background-color: ${colors.captionControlBackground};
  opacity: ${({ isHidden, fullScreen }) =>
    isHidden && fullScreen ? "0.35" : "1"};
`;

type CaptionControlMenuProps = {
  preferences: VideoPlayerPreferences;
  setFontSizeMultiplier: (multiplier: number) => void;
  rightContainer?: ReactNode;
  fullScreen?: boolean;
};

export const CaptionControl = ({
  preferences,
  setFontSizeMultiplier,
  rightContainer,
  fullScreen = false,
}: CaptionControlMenuProps) => {
  const [isHidden, toggleHidden] = useToggle(false);
  const handleChangeFontMultiplier = useCallback(
    (newSize: number) => {
      setFontSizeMultiplier(newSize);
    },
    [setFontSizeMultiplier]
  );

  const sizeTipFormatter = useCallback((value: number) => `${value}x`, []);

  return (
    <div style={{ position: "relative" }}>
      <Wrapper fullScreen={fullScreen} isHidden={isHidden}>
        <FontSizeOutlined
          style={{ color: colors.white, marginRight: "10px", fontSize: "20px" }}
        />
        <Slider
          style={{ width: "200px" }}
          min={1}
          max={2.5}
          step={0.25}
          dots
          value={preferences.fontSizeMultiplier}
          onChange={handleChangeFontMultiplier}
          tipFormatter={sizeTipFormatter}
        />
        <div style={{ position: "relative", marginLeft: "auto" }}>
          {rightContainer}
        </div>
      </Wrapper>
      {fullScreen && (
        <Hider
          fullScreen={fullScreen}
          isHidden={isHidden}
          onClick={toggleHidden}
        >
          {isHidden && <CaretUpOutlined></CaretUpOutlined>}
          {!isHidden && <CaretDownOutlined></CaretDownOutlined>}
        </Hider>
      )}
    </div>
  );
};
