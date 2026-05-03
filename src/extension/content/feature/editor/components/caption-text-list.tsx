import * as React from "react";
import { ChangeEvent, MutableRefObject } from "react";
import { colors } from "@/common/colors";
import { DurationInput } from "@/common/components/duration-input";
import { WarningText } from "@/common/components/warning-text";
import { TIME } from "@/common/constants";
import ClockCircleOutlined from "@ant-design/icons/ClockCircleOutlined";
import CompressOutlined from "@ant-design/icons/CompressOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import LoginOutlined from "@ant-design/icons/LoginOutlined";
import LogoutOutlined from "@ant-design/icons/LogoutOutlined";
import PlusCircleFilled from "@ant-design/icons/PlusCircleFilled";
import { PayloadAction } from "@reduxjs/toolkit";
import * as dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { AutoSizer, List, ListRowProps } from "react-virtualized";
import {
  addCaptionToTrackRelative,
  deleteCaption,
  modifyCaptionEndTime,
  modifyCaptionStartTime,
  modifyCaptionText,
} from "@/common/feature/caption-editor/actions";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import {
  AddBetween,
  CaptionTextRow,
  CueActionButton,
  DisabledNumberFormat,
  EditorTextArea,
  EditorTextAreaWrapper,
  NoTextInTrack,
  ScrollingEditorField,
  ScrollingText,
  ScrollingTime,
  TextEditorColumn,
  TextEditorPane,
  TextEditorRow,
  TimeInput,
  TimeInputLabel,
  NotAvailableWrapper,
} from "./caption-editor.styled";
import { LexicalEditorWrapper } from "./lexical-editor-wrapper";

dayjs.extend(duration);

function NotAvailableWithAdvancedCaption() {
  return (
    <NotAvailableWrapper>
      Not available with advanced captions
    </NotAvailableWrapper>
  );
}

type CaptionTextListProps = {
  data: CaptionDataContainer | undefined;
  selectedTrack: number;
  selectedCaption: number;
  isAdvancedCaption?: boolean;
  captionListKeySuffix: MutableRefObject<number>;
  textEditorScrollRef: MutableRefObject<List | null>;
  updateCaption: (action: any, callback?: () => void) => void;
  queueDebounceUpdateCaption: (action: PayloadAction<any>) => void;
  setSelectedCaption: (captionId: number) => void;
  setVideoTime: (timeInSeconds: number, scrollTimeline?: boolean) => void;
  isRichTextMode?: boolean;
};

export const CaptionTextList = ({
  data,
  selectedTrack,
  selectedCaption,
  isAdvancedCaption,
  captionListKeySuffix,
  textEditorScrollRef,
  updateCaption,
  queueDebounceUpdateCaption,
  setSelectedCaption,
  setVideoTime,
  isRichTextMode,
}: CaptionTextListProps) => {
  const handleStartTimeKeyboardInput =
    (trackId: number, captionId: number) => (value: string) => {
      updateCaption(
        modifyCaptionStartTime({ trackId, captionId, newFormattedTime: value }),
      );
    };

  const handleChangeStartTime =
    (trackId: number, captionId: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      queueDebounceUpdateCaption(
        modifyCaptionStartTime({
          trackId,
          captionId,
          newFormattedTime: event.target.value,
        }),
      );
    };

  const handleEndTimeKeyboardInput =
    (trackId: number, captionId: number) => (value: string) => {
      updateCaption(
        modifyCaptionEndTime({ trackId, captionId, newFormattedTime: value }),
      );
    };

  const handleChangeEndTime =
    (trackId: number, captionId: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      queueDebounceUpdateCaption(
        modifyCaptionEndTime({
          trackId,
          captionId,
          newFormattedTime: event.target.value,
        }),
      );
    };

  const handleChangeCaptionText =
    (trackId: number, captionId: number) =>
    (event: ChangeEvent<HTMLTextAreaElement> | string) => {
      const text = typeof event === 'string' ? event : event.target.value;
      queueDebounceUpdateCaption(
        modifyCaptionText({
          trackId,
          captionId,
          text,
        }),
      );
    };

  const handleClickCaptionTextArea =
    (trackId: number, captionId: number) => () => {
      if (!textEditorScrollRef.current) {
        return;
      }
      setSelectedCaption(captionId);
    };

  const handleJumpToCaption = (trackId: number, captionId: number) => () => {
    if (!data || !textEditorScrollRef.current) {
      return;
    }
    const startTime = data.tracks[trackId].cues[captionId].start;
    setVideoTime(startTime / 1000, true);
    setSelectedCaption(captionId);
  };

  const handleDeleteCaption = (trackId: number, captionId: number) => () => {
    if (!data) {
      return;
    }
    captionListKeySuffix.current++;
    if (captionId === selectedCaption) {
      if (selectedCaption >= data.tracks[trackId].cues.length - 1) {
        // Is the last, we need to make the previous caption the selected one
        setSelectedCaption(selectedCaption - 1 >= 0 ? selectedCaption - 1 : -1);
      }
    }
    updateCaption(deleteCaption({ trackId, captionId }));
  };

  const handleClickAddCaptionBetweenCaptions =
    (trackId: number, captionId: number) => (event: React.MouseEvent) => {
      captionListKeySuffix.current++;
      updateCaption(addCaptionToTrackRelative({ trackId, captionId }));
    };

  const noTextRowRenderer = () => {
    return (
      <NoTextInTrack
        onClick={handleClickAddCaptionBetweenCaptions(selectedTrack, 0)}
      >
        <div>Add caption</div>
        <PlusCircleFilled />
      </NoTextInTrack>
    );
  };

  if (!data) {
    return <></>;
  }

  const captionCount =
    selectedTrack >= 0 &&
    data.tracks[selectedTrack] &&
    data.tracks[selectedTrack].cues
      ? data.tracks[selectedTrack].cues.length
      : 0;

  const trackTextRowRenderer = ({
    key,
    style,
    index,
    isScrolling,
  }: ListRowProps) => {
    const { tracks } = data;
    const currentTrack = tracks[selectedTrack];
    if (!currentTrack) {
      return <></>;
    }

    const currentCaption = currentTrack.cues[index];

    const formattedStartTime = dayjs
      .duration(Math.floor(currentCaption.start), "milliseconds")
      .format("HH:mm:ss.SSS");

    const start = dayjs
      .duration(currentCaption.start, "milliseconds")
      .format("HHmmssSSS");

    const end = dayjs
      .duration(currentCaption.end, "milliseconds")
      .format("HHmmssSSS");
    const durationPreformat = dayjs.duration(
      currentCaption.end - currentCaption.start,
      "milliseconds",
    );
    const durationStr =
      durationPreformat.format("HHmmss") +
      durationPreformat.milliseconds().toFixed(0).padStart(3, "0");

    // Use a property of the previous caption as part of this row's key so that reordering captions will trigger a refresh
    const previousCaptionKeyPart = currentTrack.cues[index - 1]
      ? currentTrack.cues[index - 1].end
      : "0";
    const rowKey = `${key}_${selectedTrack}_${captionListKeySuffix.current}_${previousCaptionKeyPart}`;
    const characterPerSecond =
      (currentCaption.text || "").length /
      (currentCaption.end - currentCaption.start) /
      TIME.MS_TO_SECONDS;
    const charPerSecString = characterPerSecond.toFixed(2);
    return (
      <CaptionTextRow
        key={rowKey}
        style={style}
        selected={index === selectedCaption}
      >
        <AddBetween
          top={true}
          first={index === 0}
          onClick={handleClickAddCaptionBetweenCaptions(selectedTrack, index)}
        >
          <PlusCircleFilled />
        </AddBetween>
        <TextEditorRow>
          <TextEditorColumn>
            {isRichTextMode ? (
              <LexicalEditorWrapper
                initialText={currentCaption.text}
                onChange={handleChangeCaptionText(selectedTrack, index)}
                onClick={handleClickCaptionTextArea(selectedTrack, index)}
              />
            ) : (
              <EditorTextAreaWrapper>
                <EditorTextArea
                  dir="auto"
                  key={rowKey}
                  name={`nc-ta-${index}`}
                  id={`nc-ta-${index}`}
                  dirName={`nc-ta-${index}.dir`}
                  defaultValue={currentCaption.text}
                  onClick={handleClickCaptionTextArea(selectedTrack, index)}
                  onChange={handleChangeCaptionText(selectedTrack, index)}
                />
              </EditorTextAreaWrapper>
            )}
            <WarningText $warn={characterPerSecond > 25}>
              {charPerSecString} char/s
            </WarningText>
          </TextEditorColumn>
          <TextEditorColumn>
            <CueActionButton
              onClick={handleJumpToCaption(selectedTrack, index)}
              size="small"
            >
              <CompressOutlined />
            </CueActionButton>
            <CueActionButton
              onClick={handleDeleteCaption(selectedTrack, index)}
              size="small"
            >
              <DeleteOutlined style={{ color: colors.dislike }} />
            </CueActionButton>
          </TextEditorColumn>
          <TextEditorColumn>
            <div>
              <TimeInput>
                <TimeInputLabel>
                  <LoginOutlined />
                </TimeInputLabel>
                <DurationInput
                  value={start}
                  onChange={handleChangeStartTime(selectedTrack, index)}
                  onKeyboardShortcutInput={handleStartTimeKeyboardInput(
                    selectedTrack,
                    index,
                  )}
                />
              </TimeInput>
            </div>
            <div>
              <TimeInput>
                <TimeInputLabel>
                  <ClockCircleOutlined />
                </TimeInputLabel>
                <DisabledNumberFormat
                  format={"##:##:##.###"}
                  value={durationStr}
                  displayType="text"
                />
              </TimeInput>
            </div>
            <div>
              <TimeInput>
                <TimeInputLabel>
                  <LogoutOutlined />
                </TimeInputLabel>
                <DurationInput
                  value={end}
                  onChange={handleChangeEndTime(selectedTrack, index)}
                  onKeyboardShortcutInput={handleEndTimeKeyboardInput(
                    selectedTrack,
                    index,
                  )}
                />
              </TimeInput>
            </div>
          </TextEditorColumn>
        </TextEditorRow>
        {index === currentTrack.cues.length - 1 && (
          <AddBetween
            top={false}
            last={true}
            onClick={handleClickAddCaptionBetweenCaptions(
              selectedTrack,
              index + 1,
            )}
          >
            <PlusCircleFilled />
          </AddBetween>
        )}
        <ScrollingEditorField
          style={{
            height: style.height,
            width: style.width,
            opacity: isScrolling ? 1 : 0,
          }}
          key={key}
        >
          <ScrollingTime>{formattedStartTime}</ScrollingTime>
          <ScrollingText>{currentCaption.text.substring(0, 32)}</ScrollingText>
        </ScrollingEditorField>
      </CaptionTextRow>
    );
  };

  return (
    <TextEditorPane>
      {isAdvancedCaption && <NotAvailableWithAdvancedCaption />}
      {!isAdvancedCaption && (
        <AutoSizer>
          {({ width, height }) => (
            <List
              ref={textEditorScrollRef}
              height={height}
              width={width}
              rowCount={captionCount}
              rowHeight={170}
              overscanRowCount={2}
              noRowsRenderer={noTextRowRenderer}
              rowRenderer={trackTextRowRenderer}
            />
          )}
        </AutoSizer>
      )}
    </TextEditorPane>
  );
};
