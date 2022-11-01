import * as React from "react";
import { Col, InputNumber, Row } from "antd";
import SyncOutlined from "@ant-design/icons/SyncOutlined";
import { ButtonWithTooltip } from "@/common/components/ws-button";
import { faArrowsAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Coords } from "@/common/types";

export const PositionControl = ({
  position,
  isMovingCaptionPosition,
  onChangeCaptionX,
  onChangeCaptionY,
  onToggleMoveCaptionPosition,
  onResetCaptionPosition,
}: {
  position: Coords;
  isMovingCaptionPosition: boolean;
  onChangeCaptionX: (value: number) => void;
  onChangeCaptionY: (value: number) => void;
  onToggleMoveCaptionPosition: () => void;
  onResetCaptionPosition: () => void;
}) => {
  return (
    <Row align={"middle"}>
      <Col span={12}>
        <div>
          <InputNumber
            addonBefore={"X"}
            min={-100}
            max={200}
            step={1}
            value={position.x * 100}
            onChange={onChangeCaptionX}
          />
        </div>
        <div>
          <InputNumber
            addonBefore={"Y"}
            min={-100}
            max={200}
            step={1}
            value={position.y * 100}
            onChange={onChangeCaptionY}
          />
        </div>
      </Col>
      <Col span={12}>
        <ButtonWithTooltip
          title="Move"
          onClick={onToggleMoveCaptionPosition}
          buttonProps={{
            type: isMovingCaptionPosition ? "primary" : "default",
            style: { display: "block" },
          }}
        >
          <FontAwesomeIcon icon={faArrowsAlt} />
        </ButtonWithTooltip>
        <ButtonWithTooltip
          title="Reset to default"
          tooltipProps={{ placement: "bottom" }}
          onClick={onResetCaptionPosition}
          buttonProps={{
            style: { display: "block" },
          }}
        >
          <SyncOutlined />
        </ButtonWithTooltip>
      </Col>
    </Row>
  );
};
