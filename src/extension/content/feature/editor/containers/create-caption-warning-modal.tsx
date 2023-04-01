import * as React from "react";
import { useDispatch } from "react-redux";
import Modal from "antd/lib/modal";

import { generateCaptionAndShowEditor } from "@/common/feature/caption-editor/actions";

export const CreateCaptionWarningModal = ({
  visible,
  onCancel,
}: {
  visible: boolean;
  onCancel: (e?: React.MouseEvent<HTMLElement>) => void;
}) => {
  const dispatch = useDispatch();
  const handleOpenEditor = () => {
    dispatch(
      generateCaptionAndShowEditor({
        tabId: globalThis.tabId,
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
      })
    );
    onCancel();
  };
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      okText={"Open Editor"}
      onOk={handleOpenEditor}
      title={"Warning"}
    >
      <div>
        You are about to create editable captions using the loaded ASS/SSA file.
      </div>
      <br />
      <div>
        The NekoCap editor does not perform well with Substation Alpha files
        that contain complex effects. They will cause the page to freeze.
      </div>
      <br />
      <div>
        Please only continue if you know your file is relatively simple!
      </div>
      <br />
      <div>
        <b>Important: </b>Captions edited with the NekoCap editor does not
        currently work with the Advanced Renderer! If you select the advanced
        renderer, you will see the content from the original file!
      </div>
    </Modal>
  );
};
