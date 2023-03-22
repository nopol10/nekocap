import * as React from "react";
import styled from "styled-components";
import { CaptionAlignment } from "@/common/caption-parsers/types";
import { Button, Col, Row, Tabs } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faDotCircle,
} from "@fortawesome/free-solid-svg-icons";
import { CSSProperties } from "react";
import chunk from "lodash/chunk";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { colors } from "@/common/colors";

const DirectionButton = styled(Button)`
  &.ant-btn-dashed {
    border-color: ${colors.base};
  }
`;

type AlignmentControlProps = {
  selectedAlignment?: CaptionAlignment;
  defaultAlignment: CaptionAlignment;
  onChange: (alignment: CaptionAlignment) => void;
};

const directions: {
  alignment: CaptionAlignment;
  style?: CSSProperties;
  icon: IconProp;
}[] = [
  {
    alignment: CaptionAlignment.TopLeft,
    style: { transform: "rotate(45deg)" },
    icon: faAngleLeft,
  },
  {
    alignment: CaptionAlignment.TopCenter,
    icon: faAngleUp,
  },
  {
    alignment: CaptionAlignment.TopRight,
    style: { transform: "rotate(-45deg)" },
    icon: faAngleRight,
  },
  {
    alignment: CaptionAlignment.MiddleLeft,
    icon: faAngleLeft,
  },
  {
    alignment: CaptionAlignment.MiddleCenter,
    icon: faDotCircle,
  },
  {
    alignment: CaptionAlignment.MiddleRight,
    icon: faAngleRight,
  },
  {
    alignment: CaptionAlignment.BottomLeft,
    style: { transform: "rotate(-45deg)" },
    icon: faAngleLeft,
  },
  {
    alignment: CaptionAlignment.BottomCenter,
    icon: faAngleDown,
  },
  {
    alignment: CaptionAlignment.BottomRight,
    style: { transform: "rotate(45deg)" },
    icon: faAngleRight,
  },
];

export const AlignmentControl = ({
  selectedAlignment,
  defaultAlignment,
  onChange,
}: AlignmentControlProps) => {
  // Let the view range be 2 separate variables so we know when to rescale the timeline
  const handleClickAlignment = (alignment: CaptionAlignment) => () => {
    onChange(alignment);
  };

  return (
    <>
      {chunk(directions, 3).map((chunk, chunkId) => {
        return (
          <Row justify={"center"} key={`dir-${chunkId}`}>
            {chunk.map((direction, index) => {
              const isSelected = direction.alignment === selectedAlignment;
              const isDefault =
                selectedAlignment === undefined &&
                direction.alignment === defaultAlignment;
              const buttonType = isSelected
                ? "primary"
                : isDefault
                ? "dashed"
                : "default";
              return (
                <Col span={8} key={`dir-${chunkId}-${index}`}>
                  <DirectionButton
                    value={direction.alignment}
                    onClick={handleClickAlignment(direction.alignment)}
                    type={buttonType}
                    style={{ width: "100%" }}
                  >
                    <FontAwesomeIcon
                      icon={direction.icon}
                      style={direction.style}
                    />
                  </DirectionButton>
                </Col>
              );
            })}
          </Row>
        );
      })}
    </>
  );
};
