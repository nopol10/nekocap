import * as React from "react";
import styled from "styled-components";
import { Col, InputNumber, Row } from "antd";
import SyncOutlined from "@ant-design/icons/SyncOutlined";
import { ButtonWithTooltip } from "@/common/components/ws-button";
import { faArrowsAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Coords } from "@/common/types";

const CoordinateInput = styled(InputNumber)`
  width: 76px !important;
`;

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
          <span
            style={{
              display: "inline-block",
              width: "15px",
              marginBottom: "10px",
            }}
          >
            X:{" "}
          </span>
          <CoordinateInput
            min={-100}
            max={200}
            step={1}
            value={position.x * 100}
            onChange={onChangeCaptionX}
          />
        </div>
        <div>
          <span style={{ display: "inline-block", width: "15px" }}>Y: </span>
          <CoordinateInput
            min={-100}
            max={200}
            step={1}
            value={position.y * 100}
            onChange={onChangeCaptionY}
          />
        </div>
      </Col>
      <Col span={8}>
        <ButtonWithTooltip
          title="Move"
          onClick={onToggleMoveCaptionPosition}
          buttonProps={{
            type: isMovingCaptionPosition ? "primary" : "default",
          }}
        >
          <FontAwesomeIcon icon={faArrowsAlt} />
        </ButtonWithTooltip>
        <ButtonWithTooltip
          title="Reset to default"
          tooltipProps={{ placement: "bottom" }}
          onClick={onResetCaptionPosition}
        >
          <SyncOutlined />
        </ButtonWithTooltip>
      </Col>
    </Row>
  );
};
