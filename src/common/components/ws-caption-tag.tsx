import React, { ReactElement, useMemo } from "react";
import type { CustomTagProps } from "rc-select/lib/interface/generator";

import { Tag } from "antd";
import { getCaptionTagFromTagString } from "../feature/video/utils";

export type WSCaptionTagProps = Partial<CustomTagProps> & {
  tag: string;
};

export const WSCaptionTag = (props: WSCaptionTagProps): ReactElement => {
  const { tag, closable, onClose } = props;
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const captionTag = useMemo(() => getCaptionTagFromTagString(tag), [tag]);
  return (
    <Tag
      color={captionTag.color}
      onMouseDown={onPreventMouseDown}
      closable={closable}
      onClose={onClose}
    >
      {captionTag.name}
    </Tag>
  );
};
