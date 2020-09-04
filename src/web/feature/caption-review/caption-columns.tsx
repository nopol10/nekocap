import * as dayjs from "dayjs";
import { NekoCaption } from "@/common/caption-parsers/types";

export const captionDataColumns = {
  startTime: {
    title: "Time",
    dataIndex: "start",
    key: "start",
    render: (text, record: NekoCaption, index) => {
      // Splitting and replacing due to an issue with dayjs' duration format leaving the decimal part of the milliseconds in the string
      return dayjs
        .duration(text)
        .format("HH:mm:ss SSS")
        .split(".")[0]
        .replace(" ", ".");
    },
  },
  captionText: {
    title: "Content",
    dataIndex: "text",
    key: "text",
  },
};
