import * as React from "react";
import {
  CaptionAlignment,
  CaptionDataContainer,
} from "@/common/caption-parsers/types";
import { Tabs } from "antd";
import Form from "antd/lib/form";
import { AlignmentControl } from "./alignment-control";
import {
  modifyCaption,
  modifyCaptionGlobalSettings,
  modifyCaptionTrackSettings,
} from "@/common/feature/caption-editor/actions";
import { DEFAULT_COORDS_SETTINGS, DEFAULT_LAYOUT_SETTINGS } from "../constants";
import { PositionControl } from "./position-control";
import { CaptionModificationState } from "@/common/feature/caption-editor/types";
import { AnyAction } from "@reduxjs/toolkit";
const { TabPane } = Tabs;

type SettingsPanelProps = {
  caption?: CaptionDataContainer;
  videoElement: HTMLVideoElement;
  videoDurationMs: number;
  selectedTrack: number;
  selectedCaption: number;
  captionModificationState: CaptionModificationState;
  onToggleMoveCaptionPosition: () => void;
  onToggleMoveTrackPosition: () => void;
  onToggleMoveGlobalPosition: () => void;
  onUpdateCaption: (action: AnyAction) => void;
};

export const SettingsPanel = ({
  caption,
  videoElement,
  videoDurationMs,
  selectedTrack,
  selectedCaption,
  captionModificationState,
  onToggleMoveCaptionPosition,
  onToggleMoveTrackPosition,
  onToggleMoveGlobalPosition,
  onUpdateCaption,
}: SettingsPanelProps) => {
  if (!caption) {
    return null;
  }
  // Let the view range be 2 separate variables so we know when to rescale the timeline
  const showGlobalTab = true;
  const showTrackTab = selectedTrack >= 0;
  const showCaptionTab = selectedTrack >= 0 && selectedCaption >= 0;

  const handleChangeGlobalAlignment = (alignment: CaptionAlignment) => {
    const newCaption = modifyCaptionGlobalSettings({
      settings: {
        layout: {
          ...caption.settings?.layout,
          alignment,
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeTrackAlignment = (alignment: CaptionAlignment) => {
    const newCaption = modifyCaptionTrackSettings({
      trackId: selectedTrack,
      settings: {
        layout: {
          ...caption.tracks[selectedTrack].settings?.layout,
          alignment,
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeCaptionAlignment = (alignment: CaptionAlignment) => {
    const captionData = caption.tracks[selectedTrack].cues[selectedCaption];
    const newCaption = modifyCaption({
      trackId: selectedTrack,
      captionId: selectedCaption,
      newCaption: {
        ...captionData,
        layout: {
          ...captionData.layout,
          alignment,
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeCaptionX = (xValue: number) => {
    const captionData = caption.tracks[selectedTrack].cues[selectedCaption];
    const newCaption = modifyCaption({
      trackId: selectedTrack,
      captionId: selectedCaption,
      newCaption: {
        ...captionData,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...captionData.layout,
          position: {
            ...DEFAULT_COORDS_SETTINGS,
            ...captionData.layout?.position,
            x: xValue / 100,
          },
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeCaptionY = (yValue: number) => {
    const captionData = caption.tracks[selectedTrack].cues[selectedCaption];
    const newCaption = modifyCaption({
      trackId: selectedTrack,
      captionId: selectedCaption,
      newCaption: {
        ...captionData,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...captionData.layout,
          position: {
            ...DEFAULT_COORDS_SETTINGS,
            ...captionData.layout?.position,
            y: yValue / 100,
          },
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeTrackX = (xValue: number) => {
    const trackData = caption.tracks[selectedTrack];
    const trackSettings = trackData.settings;
    const newCaption = modifyCaptionTrackSettings({
      trackId: selectedTrack,
      settings: {
        ...trackSettings,
        layout: {
          ...trackSettings.layout,
          position: {
            ...DEFAULT_COORDS_SETTINGS,
            ...trackSettings.layout?.position,
            x: xValue / 100,
          },
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeTrackY = (yValue: number) => {
    const trackData = caption.tracks[selectedTrack];
    const trackSettings = trackData.settings;
    const newCaption = modifyCaptionTrackSettings({
      trackId: selectedTrack,
      settings: {
        ...trackSettings,
        layout: {
          ...trackSettings.layout,
          position: {
            ...DEFAULT_COORDS_SETTINGS,
            ...trackSettings.layout?.position,
            y: yValue / 100,
          },
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeGlobalX = (xValue: number) => {
    const globalSettings = caption.settings;
    const newCaption = modifyCaptionGlobalSettings({
      settings: {
        ...globalSettings,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...globalSettings.layout,
          position: {
            ...DEFAULT_COORDS_SETTINGS,
            ...globalSettings.layout?.position,
            x: xValue / 100,
          },
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleChangeGlobalY = (yValue: number) => {
    const globalSettings = caption.settings;
    const newCaption = modifyCaptionGlobalSettings({
      settings: {
        ...globalSettings,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...globalSettings.layout,
          position: {
            ...DEFAULT_COORDS_SETTINGS,
            ...globalSettings.layout?.position,
            y: yValue / 100,
          },
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleToggleMoveCaptionPosition = () => {
    onToggleMoveCaptionPosition();
  };

  const handleToggleMoveTrackPosition = () => {
    onToggleMoveTrackPosition();
  };

  const handleToggleMoveGlobalPosition = () => {
    onToggleMoveGlobalPosition();
  };

  const handleResetCaptionPosition = () => {
    const captionData = caption.tracks[selectedTrack].cues[selectedCaption];
    const newCaption = modifyCaption({
      trackId: selectedTrack,
      captionId: selectedCaption,
      newCaption: {
        ...captionData,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...captionData.layout,
          position: undefined,
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleResetTrackPosition = () => {
    const trackData = caption.tracks[selectedTrack];
    const trackSettings = trackData.settings;
    const newCaption = modifyCaptionTrackSettings({
      trackId: selectedTrack,
      settings: {
        ...trackSettings,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...trackSettings.layout,
          position: undefined,
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const handleResetGlobalPosition = () => {
    const captionSettings = caption.settings;
    const newCaption = modifyCaptionGlobalSettings({
      settings: {
        ...captionSettings,
        layout: {
          ...DEFAULT_LAYOUT_SETTINGS,
          ...captionSettings.layout,
          position: undefined,
        },
      },
    });
    onUpdateCaption(newCaption);
  };

  const renderGlobalPane = () => {
    const globalAlignment = caption.settings?.layout?.alignment;
    let position = caption.settings?.layout?.position || { x: 0, y: 0 };
    return (
      <Form>
        <Form.Item label="Alignment" wrapperCol={{ span: 8 }}>
          <AlignmentControl
            selectedAlignment={globalAlignment}
            defaultAlignment={CaptionAlignment.BottomCenter}
            onChange={handleChangeGlobalAlignment}
          />
        </Form.Item>
        <Form.Item label="Position (%)" wrapperCol={{ span: 8 }}>
          <PositionControl
            position={position}
            isMovingCaptionPosition={
              captionModificationState === CaptionModificationState.Global
            }
            onChangeCaptionX={handleChangeGlobalX}
            onChangeCaptionY={handleChangeGlobalY}
            onToggleMoveCaptionPosition={handleToggleMoveGlobalPosition}
            onResetCaptionPosition={handleResetGlobalPosition}
          />
        </Form.Item>
      </Form>
    );
  };

  const renderTrackPane = () => {
    const track = caption.tracks && caption.tracks[selectedTrack];
    if (!track) {
      return null;
    }
    const trackAlignment = track.settings?.layout?.alignment;
    let position = track.settings?.layout?.position || { x: 0, y: 0 };
    return (
      <Form>
        <Form.Item label="Alignment" wrapperCol={{ span: 8 }}>
          <AlignmentControl
            selectedAlignment={trackAlignment}
            defaultAlignment={CaptionAlignment.BottomCenter}
            onChange={handleChangeTrackAlignment}
          />
        </Form.Item>
        <Form.Item label="Position (%)" wrapperCol={{ span: 8 }}>
          <PositionControl
            position={position}
            isMovingCaptionPosition={
              captionModificationState === CaptionModificationState.Track
            }
            onChangeCaptionX={handleChangeTrackX}
            onChangeCaptionY={handleChangeTrackY}
            onToggleMoveCaptionPosition={handleToggleMoveTrackPosition}
            onResetCaptionPosition={handleResetTrackPosition}
          />
        </Form.Item>
      </Form>
    );
  };

  const renderCaptionPane = () => {
    const track = caption.tracks && caption.tracks[selectedTrack];
    if (!track) {
      return null;
    }
    const captionData = track.cues[selectedCaption];
    if (!captionData) {
      return;
    }

    const captionAlignment = captionData.layout?.alignment;
    let position = captionData.layout?.position || { x: 0, y: 0 };
    return (
      <Form>
        <Form.Item label="Alignment" wrapperCol={{ span: 8 }}>
          <AlignmentControl
            selectedAlignment={captionAlignment}
            defaultAlignment={CaptionAlignment.BottomCenter}
            onChange={handleChangeCaptionAlignment}
          />
        </Form.Item>
        <Form.Item label="Position (%)" wrapperCol={{ span: 8 }}>
          <PositionControl
            position={position}
            isMovingCaptionPosition={
              captionModificationState === CaptionModificationState.Caption
            }
            onChangeCaptionX={handleChangeCaptionX}
            onChangeCaptionY={handleChangeCaptionY}
            onToggleMoveCaptionPosition={handleToggleMoveCaptionPosition}
            onResetCaptionPosition={handleResetCaptionPosition}
          />
        </Form.Item>
      </Form>
    );
  };

  return (
    <>
      <Tabs defaultActiveKey="global">
        {showGlobalTab && (
          <TabPane tab="Global" key="global">
            {renderGlobalPane()}
          </TabPane>
        )}
        {showTrackTab && (
          <TabPane tab={`Track ${selectedTrack + 1}`} key="track">
            {renderTrackPane()}
          </TabPane>
        )}
        {showCaptionTab && (
          <TabPane tab={`Caption`} key="caption">
            {renderCaptionPane()}
          </TabPane>
        )}
      </Tabs>
    </>
  );
};
