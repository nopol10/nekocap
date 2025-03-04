import { DisablebleIcon } from "@/common/components/disableble-icon";
import { WSButton } from "@/common/components/ws-button";
import { updateKeyboardShortcutType } from "@/common/feature/caption-editor/actions";
import {
  currentShortcutTypeSelector,
  keyboardShortcutsSelector,
} from "@/common/feature/caption-editor/selectors";
import { SHORTCUT_NAME } from "@/common/feature/caption-editor/shortcut-constants";
import { SHORTCUT_TYPES } from "@/common/feature/caption-editor/types";
import { CaptionFileFormat, UndoComponentProps } from "@/common/types";
import RedoOutlined from "@ant-design/icons/RedoOutlined";
import UndoOutlined from "@ant-design/icons/UndoOutlined";
import ZoomInOutlined from "@ant-design/icons/ZoomInOutlined";
import ZoomOutOutlined from "@ant-design/icons/ZoomOutOutlined";
import { faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Dropdown,
  Menu,
  message,
  Modal,
  ModalProps,
  Select,
  Slider,
  Space,
  Table,
  TableColumnsType,
} from "antd";
import { isArray, startCase } from "lodash-es";
import throttle from "lodash/throttle";
import * as React from "react";
import { useCallback, useState } from "react";
import { KeyMapOptions, MouseTrapKeySequence } from "react-hotkeys-ce";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

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
  modalProps: ModalProps;
};

const shortcutOptions = [...Object.values(SHORTCUT_TYPES)];

type ShortcutItem = {
  name: string;
  shortcut: string;
};

const shortcutColumns: TableColumnsType<ShortcutItem> = [
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

const formatShortcut = (
  shortcut: string | MouseTrapKeySequence | KeyMapOptions,
) => {
  let normalizedName = shortcut.toString();
  normalizedName = normalizedName.replace(/([a-zA-Z]+)/g, (value) => {
    return startCase(value);
  });
  return normalizedName;
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

  const handleOk = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onCancel) {
      onCancel(e);
    }
  };

  const shortcutData: ShortcutItem[] = [
    ...Object.keys(shortcuts).map((shortcutKey) => {
      const shortcut = shortcuts[shortcutKey];
      let formattedName = "";
      if (isArray(shortcut)) {
        formattedName = shortcut.map(formatShortcut).join(" or ");
      } else {
        formattedName = formatShortcut(shortcut);
      }
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
  onFixOverlaps,
  onOpenShiftTimings,
}: EditorToolbarProps) => {
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  const throttledUndo = useCallback(
    throttle(() => {
      if (onUndo) onUndo();
    }, 100),
    [],
  );

  const throttledRedo = useCallback(
    throttle(() => {
      if (onRedo) onRedo();
    }, 100),
    [],
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
          open: showShortcutModal,
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
