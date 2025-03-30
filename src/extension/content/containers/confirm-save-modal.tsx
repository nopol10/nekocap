import { Checkbox, Modal } from "antd";
import type { CheckboxChangeEvent } from "antd/lib/checkbox";
import { useState } from "react";

interface ConfirmSaveModalProps {
  visible: boolean;
  onCancel: () => void;
  onDone: (shouldSkipSaveConfirmation?: boolean) => void;
  showSkipBox?: boolean;
}

export const ConfirmSaveModal = ({
  visible,
  onCancel,
  onDone,
  showSkipBox = false,
}: ConfirmSaveModalProps) => {
  const [skipSaveConfirmation, setSkipSaveConfirmation] = useState(false);

  const handleDone = () => {
    onDone(skipSaveConfirmation);
  };

  const handleChangeSaveConfirmationCheckbox = (e: CheckboxChangeEvent) => {
    setSkipSaveConfirmation(e.target.checked);
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      okText={"Save"}
      onOk={handleDone}
      title={"Warning"}
    >
      <div>
        There is existing saved caption data for this video! Saving will
        overwrite the data!
      </div>
      {showSkipBox && (
        <div>
          <Checkbox onChange={handleChangeSaveConfirmationCheckbox}>
            Do not ask again for this session
          </Checkbox>
        </div>
      )}
    </Modal>
  );
};
