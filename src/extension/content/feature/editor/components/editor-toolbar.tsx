import Space from "antd/lib/space";
import * as React from "react";
import { Button, Dropdown, Menu, message, Select, Slider, Table } from "antd";
import styled from "styled-components";
import ZoomInOutlined from "@ant-design/icons/ZoomInOutlined";
import ZoomOutOutlined from "@ant-design/icons/ZoomOutOutlined";
import UndoOutlined from "@ant-design/icons/UndoOutlined";
import RedoOutlined from "@ant-design/icons/RedoOutlined";
import { CaptionFileFormat, UndoComponentProps } from "@/common/types";
import { DisablebleIcon } from "@/common/components/disableble-icon";
import throttle from "lodash/throttle";
import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKeyboard } from "@fortawesome/free-solid-svg-icons";
import Modal, { ModalProps } from "antd/lib/modal/Modal";
import { SHORTCUT_TYPES } from "@/common/feature/caption-editor/types";
import { useDispatch } from "react-redux";
import { updateKeyboardShortcutType } from "@/common/feature/caption-editor/actions";
import { useSelector } from "react-redux";
import {
  currentShortcutTypeSelector,
  keyboardShortcutsSelector,
} from "@/common/feature/caption-editor/selectors";
import { SHORTCUT_NAME } from "@/common/feature/caption-editor/shortcut-constants";
import { ColumnsType } from "antd/lib/table";
import { startCase } from "lodash";
import { WSButton } from "@/common/components/ws-button";

const TimelineSlider = styled(Slider)`
  width: 200px;
`;

type EditorToolbarProps = UndoComponentProps & {
  timelineScale: number;
  onSave: () => void;
  onFixOverlaps: () => void;
  onOpenShiftTimings: () => void;
  onChangeZoom: (value: number) => void;
  onExport: (fileFormat: keyof typeof CaptionFileFormat) => void;
};

type KeyboardShortcutModalProps = {
  modalProps?: ModalProps;
};

const shortcutOptions = [...Object.values(SHORTCUT_TYPES)];

type ShortcutItem = {
  name: string;
  shortcut: string;
};

const shortcutColumns: ColumnsType<ShortcutItem> = [
  {
    key: "name",
    dataIndex: "name",
    title: "Operation",
  },
  {
    key: "shortcut",
    dataIndex: "shortcut",
    title: "Shortcut",
  },
];

const formatShortcut = (name: string) => {
  name = name.replace(/([a-zA-Z]+)/g, (value) => {
    return startCase(value);
  });
  name = name.replace(",", " or ");
  return name;
};

const KeyboardShortcutModal = ({ modalProps }: KeyboardShortcutModalProps) => {
  const { onCancel } = modalProps;
  const dispatch = useDispatch();
  const currentShortcutType = useSelector(currentShortcutTypeSelector);
  const shortcuts = useSelector(keyboardShortcutsSelector);
  const [shortcutType, setShortcutType] = useState(currentShortcutType);
  const handleChangeShortcutType = (value: keyof typeof SHORTCUT_TYPES) => {
    setShortcutType(value);
    dispatch(updateKeyboardShortcutType(value)).then(() => {
      message.success(`Shortcut preset updated to: ${value}`);
    });
  };

  const handleOk = () => {
    if (onCancel) {
      onCancel(undefined);
    }
  };

  const shortcutData: ShortcutItem[] = [
    ...Object.keys(shortcuts).map((shortcutKey) => {
      const shortcut = shortcuts[shortcutKey].toString();
      const formattedName = formatShortcut(shortcut);
      return { name: SHORTCUT_NAME[shortcutKey], shortcut: formattedName };
    }),
  ];

  return (
    <>
      <Modal {...modalProps} onOk={handleOk}>
        <span>Shortcut preset: </span>
        <Select
          onChange={handleChangeShortcutType}
          value={shortcutType}
          style={{ marginBottom: "20px" }}
        >
          {shortcutOptions.map((shortcut) => {
            return (
              <Select.Option key={shortcut} value={shortcut}>
                {shortcut}
              </Select.Option>
            );
          })}
        </Select>
        <Table
          columns={shortcutColumns}
          dataSource={shortcutData}
          pagination={false}
        />
      </Modal>
    </>
  );
};

export const EditorToolbar = ({
  timelineScale,
  onChangeZoom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onFixOverlaps,
  onOpenShiftTimings,
}: EditorToolbarProps) => {
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  const throttledUndo = useCallback(
    throttle(() => {
      if (onUndo) onUndo();
    }, 100),
    []
  );

  const throttledRedo = useCallback(
    throttle(() => {
      if (onRedo) onRedo();
    }, 100),
    []
  );

  const handleClickShortcutsHelp = () => {
    setShowShortcutModal(true);
  };

  const handleCloseShortcutModal = () => {
    setShowShortcutModal(false);
    setTimeout(() => {
      // @ts-ignore
      if (document.activeElement && document.activeElement.blur) {
        // @ts-ignore
        document.activeElement.blur();
      }
    }, 400);
  };

  const handleSave = (event: React.MouseEvent) => {
    onSave();
    event.preventDefault();
  };

  const renderZoomBar = () => {
    return (
      <>
        <ZoomOutOutlined />
        <TimelineSlider
          range={false}
          defaultValue={1}
          step={0.01}
          min={0.2}
          max={1.5}
          value={timelineScale}
          onChange={onChangeZoom}
        />
        <ZoomInOutlined />
      </>
    );
  };

  const renderMenu = () => {
    return (
      <Menu>
        <Menu.SubMenu title="Timing">
          <Menu.Item onClick={onFixOverlaps}>Fix overlaps</Menu.Item>
          <Menu.Item onClick={onOpenShiftTimings}>Shift timings</Menu.Item>
        </Menu.SubMenu>
      </Menu>
    );
  };

  return (
    <>
      <KeyboardShortcutModal
        modalProps={{
          visible: showShortcutModal,
          onCancel: handleCloseShortcutModal,
        }}
      />
      <Space>
        <Dropdown overlay={renderMenu()} placement={"topCenter"}>
          <WSButton>Tools</WSButton>
        </Dropdown>
        {onUndo && (
          <DisablebleIcon disabled={!canUndo}>
            <UndoOutlined onClick={throttledUndo} />
          </DisablebleIcon>
        )}
        {onRedo && (
          <DisablebleIcon disabled={!canRedo}>
            <RedoOutlined onClick={throttledRedo} />
          </DisablebleIcon>
        )}

        {renderZoomBar()}
        <Button onClick={handleClickShortcutsHelp}>
          <FontAwesomeIcon icon={faKeyboard} />
        </Button>
      </Space>
    </>
  );
};
