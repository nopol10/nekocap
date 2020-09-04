import * as dayjs from "dayjs";
import React, { useEffect, useRef } from "react";
import NumberFormat, { NumberFormatProps } from "react-number-format";
import styled from "styled-components";
import { parseDurationToMs } from "../date-utils";

const convertRawValueToMomentFormat = (value: string) => {
  return (
    value.slice(0, 2) +
    ":" +
    value.slice(2, 4) +
    ":" +
    value.slice(4, 6) +
    "." +
    value.slice(6)
  );
};

const StyledNumberFormat = styled(NumberFormat)`
  padding: 0 10px;
  width: 100%;
  border: 1px solid #d0d0d0;
`;

type DurationInputProps = {
  numberFormatProps?: NumberFormatProps;
  onKeyboardShortcutInput?: (value: string) => void;
  [key: string]: any;
};

export const DurationInput = ({
  numberFormatProps,
  value,
  onKeyboardShortcutInput,
  inputProps,
  onChange,
  ...rest
}: DurationInputProps) => {
  const inputRef = useRef<HTMLInputElement>();
  const numberFormatRef = useRef<NumberFormat>();
  const updateOnKeyup = useRef<boolean>(false);
  const highlightMsOnChange = useRef<boolean>(false);

  useEffect(() => {
    if (highlightMsOnChange.current) {
      highlightMs();
      highlightMsOnChange.current = false;
    }
  }, [value]);

  const highlightMs = () => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.setSelectionRange(9, 12);
    });
  };

  const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!onKeyboardShortcutInput) {
      return;
    }
    const isRepeat = event.repeat;
    if (event.key === "ArrowUp") {
      const ms = parseDurationToMs(
        isRepeat ? inputRef.current.value : convertRawValueToMomentFormat(value)
      );
      let duration = dayjs.duration(ms, "ms");
      duration = duration.add(100, "milliseconds");
      const newValue = duration.format("HH:mm:ss.SSS");
      if (isRepeat) {
        inputRef.current.value = newValue;
        updateOnKeyup.current = true;
      } else {
        onKeyboardShortcutInput(newValue);
      }
      highlightMsOnChange.current = true;
      event.preventDefault();
    } else if (event.key === "ArrowDown") {
      const ms = parseDurationToMs(
        isRepeat ? inputRef.current.value : convertRawValueToMomentFormat(value)
      );
      let duration = dayjs.duration(ms, "ms");
      duration = duration.subtract(100, "milliseconds");
      const newValue = duration.format("HH:mm:ss.SSS");
      if (isRepeat) {
        inputRef.current.value = newValue;
        updateOnKeyup.current = true;
      } else {
        onKeyboardShortcutInput(newValue);
      }
      highlightMsOnChange.current = true;
      event.preventDefault();
    }
  };

  /**
   * For handling the end of repeated keydowns
   */
  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!onKeyboardShortcutInput) {
      return;
    }
    if (!updateOnKeyup.current) {
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      onKeyboardShortcutInput(inputRef.current.value);
      updateOnKeyup.current = false;
    }
  };

  return (
    <StyledNumberFormat
      ref={numberFormatRef}
      getInputRef={(el) => (inputRef.current = el)}
      format={"##:##:##.###"}
      mask={"_"}
      value={value}
      onKeyDown={handleKeydown}
      onKeyUp={handleKeyUp}
      onChange={onChange}
      {...numberFormatProps}
      {...rest}
      style={{ letterSpacing: "2px" }}
    />
  );
};
