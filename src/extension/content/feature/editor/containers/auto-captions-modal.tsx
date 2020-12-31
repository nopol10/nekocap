import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "antd/lib/modal";

import {
  fetchAutoCaptions,
  generateCaptionAndShowEditor,
  loadAutoCaption,
} from "@/common/feature/caption-editor/actions";
import { tabEditorDataSelector } from "@/common/feature/caption-editor/selectors";
import { Radio, Skeleton } from "antd";
import { useState } from "react";
import { RadioChangeEvent } from "antd/lib/radio";
import styled from "styled-components";

const StyledRadio = styled(Radio)`
  display: block;
`;

export const AutoCaptionsModal = ({
  visible,
  onCancel,
}: {
  visible: boolean;
  onCancel: (e?: React.MouseEvent<HTMLElement>) => void;
}): React.ReactElement => {
  const { tabId, videoSource, videoId } = window;
  const dispatch = useDispatch();
  const editorData = useSelector(tabEditorDataSelector(tabId));
  const isLoading = useSelector(fetchAutoCaptions.isLoading(tabId));

  const [selectedCaptionId, setSelectedCaptionId] = useState<string>(
    editorData.autoCaptions && editorData.autoCaptions.length > 0
      ? editorData.autoCaptions[0].id
      : ""
  );

  const handleLoadAutoCaption = () => {
    dispatch(
      loadAutoCaption.request({
        tabId,
        captionId: selectedCaptionId,
        videoSource,
        videoId,
      })
    );
    onCancel();
  };

  const captions = editorData.autoCaptions || [];

  const handleChangeCaption = (e: RadioChangeEvent) => {
    setSelectedCaptionId(e.target.value);
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      okText={"Load caption"}
      onOk={handleLoadAutoCaption}
      title={"Select caption"}
    >
      {isLoading && <Skeleton />}
      {!isLoading && captions.length <= 0 && <div>No captions found</div>}
      {!isLoading && captions.length > 0 && (
        <Radio.Group onChange={handleChangeCaption} value={selectedCaptionId}>
          {captions.map((caption) => {
            return (
              <StyledRadio value={caption.id} key={caption.id}>
                {caption.name}
              </StyledRadio>
            );
          })}
        </Radio.Group>
      )}
    </Modal>
  );
};
