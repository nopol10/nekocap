import { NekoCaption } from "@/common/caption-parsers/types";
import * as dayjs from "dayjs";
import { i18n } from "next-i18next";
import { ReactNode } from "react";

export const captionDataColumns = {
  startTime: {
    title: (): ReactNode => {
      return i18n.t("home.captionList.columns.time");
    },
    dataIndex: "start",
    key: "start",
    render: (text) => {
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
