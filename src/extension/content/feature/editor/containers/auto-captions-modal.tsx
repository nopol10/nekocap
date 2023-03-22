import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "antd/lib/modal";

import {
  fetchAutoCaptionList,
  fetchAutoCaption,
} from "@/common/feature/caption-editor/actions";
import { tabEditorDataSelector } from "@/common/feature/caption-editor/selectors";
import { Collapse, Radio, Skeleton } from "antd";
import { useState } from "react";
import { RadioChangeEvent } from "antd/lib/radio";
import styled from "styled-components";

const { Panel } = Collapse;
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
  const isLoading = useSelector(fetchAutoCaptionList.isLoading(tabId));

  const [selectedCaptionId, setSelectedCaptionId] = useState<string>(
    editorData?.autoCaptions && editorData.autoCaptions.length > 0
      ? editorData.autoCaptions[0].id
      : ""
  );

  const handleFetchAutoCaption = () => {
    dispatch(
      fetchAutoCaption.request({
        tabId,
        captionId: selectedCaptionId,
        videoSource,
        videoId,
      })
    );
    onCancel();
  };

  const captions = editorData?.autoCaptions || [];

  const handleChangeCaption = (e: RadioChangeEvent) => {
    setSelectedCaptionId(e.target.value);
  };

  const autoCaptions = captions.filter((caption) => caption.isAutomaticCaption);
  const userCaptions = captions.filter(
    (caption) => !caption.isAutomaticCaption
  );
  const hasAutoCaptions = autoCaptions.length > 0;
  const hasUserCaptions = userCaptions.length > 0;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      okText={"Load caption"}
      onOk={handleFetchAutoCaption}
      okButtonProps={{
        disabled: !selectedCaptionId,
      }}
      title={"Select caption"}
    >
      {isLoading && <Skeleton />}
      {!isLoading && captions.length <= 0 && <div>No captions found</div>}
      {!isLoading && (
        <Collapse defaultActiveKey={[hasUserCaptions ? "user" : "auto"]} ghost>
          {hasAutoCaptions && (
            <Panel header="Auto captions" key="auto">
              <Radio.Group
                onChange={handleChangeCaption}
                value={selectedCaptionId}
              >
                {autoCaptions.map((caption) => {
                  return (
                    <StyledRadio value={caption.id} key={caption.id}>
                      {caption.name}
                    </StyledRadio>
                  );
                })}
              </Radio.Group>
            </Panel>
          )}
          {hasUserCaptions && (
            <Panel header="User captions" key="user">
              <Radio.Group
                onChange={handleChangeCaption}
                value={selectedCaptionId}
              >
                {userCaptions.map((caption) => {
                  return (
                    <StyledRadio value={caption.id} key={caption.id}>
                      {caption.name}
                    </StyledRadio>
                  );
                })}
              </Radio.Group>
            </Panel>
          )}
        </Collapse>
      )}
    </Modal>
  );
};
