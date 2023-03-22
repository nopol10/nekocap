import * as React from "react";
import Modal from "antd/lib/modal";
import * as dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Button, Space } from "antd";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { DurationInput } from "@/common/components/duration-input";
import { TIME } from "@/common/constants";
import { parseDurationToMs } from "@/common/date-utils";
dayjs.extend(duration);

const StyledDurationInput = styled(DurationInput)`
  padding: 16px 12px;
  font-size: 18px;
`;

const TimeEntryBlock = styled.div``;

const ShiftInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const ShiftInput = styled.div`
  display: flex;
  flex-direction: row;
  button {
    height: unset;
    font-size: 26px;
  }
`;

const TimeShortcuts = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  button {
    flex: 1;
  }
`;

const TimeEntryInput = ({
  title,
  value,
  onChange,
  videoElement,
}: {
  title: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  videoElement: HTMLVideoElement;
}) => {
  const handleClickStart = () => {
    onChange({ target: { value: "00:00:00.000" } });
  };
  const handleClickCurrent = () => {
    const duration = dayjs
      .duration(videoElement.currentTime, "s")
      .format("HH:mm:ss.SSS");
    onChange({ target: { value: duration } });
  };
  const handleClickEnd = () => {
    const duration = dayjs
      .duration(videoElement.duration, "s")
      .format("HH:mm:ss.SSS");
    onChange({ target: { value: duration } });
  };
  return (
    <TimeEntryBlock>
      <div>{title} (HH:mm:ss.ms)</div>
      <StyledDurationInput value={value} onChange={onChange} />
      <TimeShortcuts>
        <Button type="dashed" onClick={handleClickStart}>
          Start
        </Button>
        <Button type="dashed" onClick={handleClickCurrent}>
          Current
        </Button>
        <Button type="dashed" onClick={handleClickEnd}>
          End
        </Button>
      </TimeShortcuts>
    </TimeEntryBlock>
  );
};

export const ShiftTimingsModal = ({
  visible,
  onCancel,
  onShift,
  videoElement,
}: {
  visible: boolean;
  onCancel: (e?: React.MouseEvent<HTMLElement>) => void;
  onShift: (shiftMs: number, startMs: number, endMs: number) => void;
  videoElement: HTMLVideoElement;
}): React.ReactElement => {
  const [startTime, setStartTime] = useState("00:00:00.000");
  const [endTime, setEndTime] = useState("00:00:00.000");
  const [shiftDuration, setShiftDuration] = useState("00:00:00.000");
  const [isForwards, setIsForwards] = useState(true);

  useEffect(() => {
    if (visible && videoElement) {
      const end = dayjs
        .duration(videoElement.duration * TIME.SECONDS_TO_MS, "milliseconds")
        .format("HH:mm:ss.SSS");
      setStartTime("00:00:00.000");
      setEndTime(end);
    }
  }, [visible, videoElement]);

  const handleShiftTimings = () => {
    const shiftMs = (isForwards ? 1 : -1) * parseDurationToMs(shiftDuration);
    const startMs = parseDurationToMs(startTime);
    const endMs = parseDurationToMs(endTime);
    console.log(startTime, endTime);
    onShift(shiftMs, startMs, endMs);
    onCancel();
  };

  const handleChangeStartTime = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStartTime(event.target.value);
  };

  const handleChangeEndTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value);
  };

  const handleChangeShiftDuration = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setShiftDuration(event.target.value);
  };

  const handleToggleDirection = () => {
    setIsForwards(!isForwards);
  };

  const directionLabel = isForwards ? "+" : "-";

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      okText={"Shift"}
      onOk={handleShiftTimings}
      title={"Shift timings"}
    >
      <div>
        <Space>
          <TimeEntryInput
            title={"Start"}
            value={startTime}
            videoElement={videoElement}
            onChange={handleChangeStartTime}
          />
          <div>to</div>
          <TimeEntryInput
            title={"End"}
            value={endTime}
            videoElement={videoElement}
            onChange={handleChangeEndTime}
          />
        </Space>
      </div>
      <ShiftInputWrapper>
        <header>by</header>
        <div>
          <ShiftInput>
            <Button onClick={handleToggleDirection}>{directionLabel}</Button>
            <StyledDurationInput
              value={shiftDuration}
              onChange={handleChangeShiftDuration}
            />
          </ShiftInput>
        </div>
      </ShiftInputWrapper>
    </Modal>
  );
};
