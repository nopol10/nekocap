import NekoLogoSvg from "@/assets/images/nekocap.svg";
import { getImageLink } from "@/common/chrome-utils";
import { colors } from "@/common/colors";
import { SplitPane } from "@/common/components/multi-split-pane/split-pane";
import { CaptionModificationState } from "@/common/feature/caption-editor/types";
import { darkModeSelector } from "@/common/processor-utils";
import { DEVICE } from "@/common/style-constants";
import { Button, Slider } from "antd";
import * as React from "react";
import { LegacyRef } from "react";
import { ObserveKeys } from "react-hotkeys-ce";
import NumberFormat from "react-number-format";
import styled from "styled-components";

export const VideoPane = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  width: 100%;
  height: 100%;
  background-color: ${colors.white};
  color: ${colors.text};

  ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: #e0e0e0;
  `)}
`;

export const SettingsPane = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0 20px 20px;
  box-sizing: border-box;
  background-color: ${colors.white};
  color: ${colors.text};

  ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: #e0e0e0;
  `)}

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: url(${getImageLink(NekoLogoSvg)});
    background-repeat: no-repeat;
    background-position: 97% 97%;
    background-size: 200px;
    background-origin: content-box;
    opacity: 0.3;
  }
`;

export const SettingsInfoMessage = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  padding: 0 10px;
  background-color: ${colors.white}77;
  border-top: 1px solid ${colors.divider};
  width: 100%;
`;

export const VideoControls = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 5px 10px;
`;

export const VolumeSlider = styled(Slider)`
  display: inline-block;
  vertical-align: middle;
  width: 100px;
`;

export const TextEditorColumn = styled.div<{ $justify?: string }>`
  display: flex !important;
  flex-direction: column !important;
  ${({ $justify }) =>
    $justify ? `justify-content: ${$justify} !important;` : ""}

  & > div,button:not(:last-child) {
    margin-bottom: 5px;
  }
`;

export const TextEditorRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
  & ${TextEditorColumn} {
    &:nth-child(1) {
      flex-grow: 1;
      flex-shrink: 0;
    }
    &:nth-child(2) {
      justify-content: center;
    }
  }
`;

type EditorVideoContainerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  $playerStyles: string;
  innerRef: LegacyRef<HTMLDivElement>;
};
export const EditorVideoContainer = styled(
  ({ innerRef, ...rest }: EditorVideoContainerProps) => {
    return <div {...rest} ref={innerRef} />;
  },
)`
  width: 100%;
  height: 100%;
  position: relative;

  ${({ $playerStyles }) => {
    return $playerStyles;
  }}
`;

export const RootSplitPane = styled(SplitPane)`
  position: relative !important;
  background-color: ${colors.white};
  min-height: unset !important;
  color: ${colors.text};

  ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: #e0e0e0;
  `)}
`;

export type RootPaneType = {
  $show: boolean;
  $captionMoveType?: CaptionModificationState;
};

export const RootPane = styled.div<RootPaneType>`
  display: ${({ $show }: RootPaneType) => ($show ? "flex" : "none")} !important;
  background-color: ${colors.white};
  color: ${colors.text};
  flex-direction: column;
  height: 100vh;
  pointer-events: all;
  font-size: 14px;
  font-family: "Arial", sans-serif;

  .ant-tabs-tab-btn {
    font-family: "Arial", sans-serif;
  }

  ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: #e0e0e0;
  `)}

  .nekocap-cap-container {
    /* pointer-events: all !important; */
    user-select: none;

    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
  }

  .nekocap-caption {
    // Override the caption container to allow dragging of captions in the editor
    pointer-events: all !important;

    ${({ $captionMoveType }: RootPaneType) => {
      if ($captionMoveType === CaptionModificationState.Global) {
        return `
          &[data-layout-type="global"] {
            .nekocap-caption-text:not(:empty)::before {
              content: "Global";
              border: 1px solid #41b1f1;
            }
          }
    `;
      } else if ($captionMoveType === CaptionModificationState.Track) {
        return `
          &[data-layout-type="track"] {
            .nekocap-caption-text:not(:empty)::before {
              content: "Track";
              border: 1px solid #e6aa3b;
            }
          }
`;
      } else if ($captionMoveType === CaptionModificationState.Caption) {
        return `
          &[data-layout-type="caption"] {
            .nekocap-caption-text:not(:empty)::before {
              content: "Caption";
              border: 1px solid #65df2d;
            }
          }
`;
      }
      return "";
    }}
  }

  .nekocap-caption-text {
    font-family: apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    &:not(:empty)::before {
      position: absolute;
      top: 0;
      left: 0;
      padding: 0 5px;
      transform: translate(0, -100%);
      pointer-events: none;
      font-size: 0.7em;
      background-color: #33333375;
    }
  }

  *,
  *:focus,
  *:hover {
    outline: none;
  }

  // Pane specific styles
  .Resizer {
    background: #000;
    opacity: 0.2;
    z-index: 1;
    box-sizing: border-box;
    background-clip: padding-box;

    &.horizontal {
      height: 11px;
      margin: -5px 0;
      border-top: 5px solid rgba(255, 255, 255, 0);
      border-bottom: 5px solid rgba(255, 255, 255, 0);
      cursor: row-resize;
      &:hover,
      &.resizing {
        border-top: 5px solid rgba(0, 0, 0, 0.5);
        border-bottom: 5px solid rgba(0, 0, 0, 0.5);
      }
    }

    &.vertical {
      width: 11px;
      margin: 0 -5px;
      border-left: 5px solid rgba(255, 255, 255, 0);
      border-right: 5px solid rgba(255, 255, 255, 0);
      cursor: col-resize;

      &:hover,
      &.resizing {
        border-left: 5px solid rgba(0, 0, 0, 0.5);
        border-right: 5px solid rgba(0, 0, 0, 0.5);
      }
    }

    &:hover {
      transition: all 2s ease;
    }
  }

  .DragLayer {
    opacity: 0;
    pointer-events: none;
    &.resizing {
      pointer-events: auto;
    }
    &.horizontal {
      cursor: row-resize;
    }
    &.vertical {
      cursor: col-resize;
    }
  }
`;

export const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  height: 100%;
  box-sizing: border-box;
  background-color: ${colors.white};
  color: ${colors.text};

  * {
    box-sizing: border-box;
  }

  ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: ${colors.textDark};
  `)}
`;

export const TextEditorPane = styled.div`
  display: block;
  width: 100%;
  background-color: ${colors.white};

  ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: ${colors.textDark};
  `)}
`;

type CaptionTextRowProps = {
  selected: boolean;
};

export const CaptionTextRow = styled.div<CaptionTextRowProps>`
  position: relative;
  box-sizing: border-box;
  padding: 10px;
  background-color: ${({ selected }: CaptionTextRowProps) =>
    selected ? colors.lightHighlight : "unset"};
  color: ${colors.text};

  ${({ selected }) =>
    darkModeSelector(`
      background-color: ${selected ? "#333333" : "unset"};
      color: ${colors.white};
    `)}
`;

export const ScrollingTime = styled.div`
  font-size: 30px;
  font-weight: bold;
`;

export const ScrollingText = styled.div`
  font-size: 26px;
`;

export const ScrollingEditorField = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  top: 0;
  left: 0;
  background-color: ${colors.white}33;
  backdrop-filter: blur(5px);
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
`;

export const NoTextInTrack = styled.div`
  text-align: center;
  font-size: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

type AddBetweenProps = {
  top: boolean;
  first?: boolean;
  last?: boolean;
};

export const AddBetween = styled.div<AddBetweenProps>`
  position: absolute;
  width: 100%;
  opacity: 0;
  font-size: ${({ first }: AddBetweenProps) => (first ? "13px" : "20px")};
  transition: opacity 200ms;
  transform: ${({ last }: AddBetweenProps) =>
    last ? "translate(-50%, -120%)" : "translate(-50%, -50%)"};
  left: 50%;
  text-align: center;
  ${({ top, first }: AddBetweenProps) => {
    if (first) {
      return "top: 10px";
    }
    return top ? "top: 0" : "top: unset";
  }};
  z-index: 10;

  &:hover {
    opacity: 1;
  }
`;

export const TimeInputLabel = styled.div`
  display: inline-block;
  flex: 0;
  border: 1px solid #d9d9d9;
  border-right: none;
  padding: 10px;
  background-color: white;
  ${darkModeSelector(`
    background-color: ${colors.disabledFieldDark};
    color: ${colors.textDark};
  `)}
`;

export const TimeInput = styled.div`
  display: flex;
`;

export const EditorTextAreaWrapper = styled(ObserveKeys)`
  flex: 1;
  width: 100%;
`;

export const EditorTextArea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: 1px solid #d9d9d9;
  resize: none !important;
  transition: none;
  font-family: "consolas", monospace;

  ${darkModeSelector(`
    background-color: #1f1f1f;
    color: #e0e0e0;
  `)}
`;

export const CueActionButton = styled(Button)`
  padding: 0 2px;
  font-size: 12px;
  @media ${DEVICE.largeDesktop} {
    padding: 0 7px;
    font-size: 14px;
  }
`;

export const DisabledNumberFormat = styled(NumberFormat<unknown>)`
  padding: 10px;
  letter-spacing: 2px;
  flex: 1;
  border: 1px solid #d9d9d9;
  background-color: ${colors.disabledField};
  overflow-x: hidden;
  font-size: 12px;
  @media ${DEVICE.largeDesktop} {
    font-size: 14px;
  }
  ${darkModeSelector(`
    background-color: ${colors.disabledFieldDark};
    color: ${colors.textDark};
  `)}
`;

export const NotAvailableWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  /* ${darkModeSelector(`
    background-color: ${colors.backgroundDark};
    color: ${colors.textDark};
  `)} */
`;
