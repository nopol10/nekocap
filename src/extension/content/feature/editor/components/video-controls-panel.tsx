import * as React from "react";
import { useCallback } from "react";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import PauseOutlined from "@ant-design/icons/PauseOutlined";
import { faVolumeMute, faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Popover, Space } from "antd";
import { MAX_VOLUME } from "../constants";
import { VideoPlayer } from "../video-player/video-player";
import { VideoScrubber } from "./video-scrubber";
import { VideoControls, VolumeSlider } from "./caption-editor.styled";

type VideoControlsPanelProps = {
  videoPlayer: VideoPlayer;
  isPlaying: boolean;
  volume: number;
  isMute: boolean;
  onClickPlay: (event: any) => void;
  onSeek: (seekedTime: number) => void;
  onChangeVolume: (newVolume: number) => void;
  onClickMute: () => void;
};

export const VideoControlsPanel = ({
  videoPlayer,
  isPlaying,
  volume,
  isMute,
  onClickPlay,
  onSeek,
  onChangeVolume,
  onClickMute,
}: VideoControlsPanelProps) => {
  return (
    <VideoControls>
      <VideoScrubber videoPlayer={videoPlayer} onSeek={onSeek} />
      <Space style={{ justifyContent: "center" }}>
        <Popover
          placement={"top"}
          content={
            <div>
              <VolumeSlider
                range={false}
                step={0.1}
                min={0}
                max={MAX_VOLUME}
                value={volume * MAX_VOLUME}
                onChange={onChangeVolume}
              />
            </div>
          }
        >
          <Button onClick={onClickMute}>
            <FontAwesomeIcon
              icon={volume > 0 && !isMute ? faVolumeUp : faVolumeMute}
              style={{
                verticalAlign: "middle",
              }}
            />
          </Button>
        </Popover>
        <Button onClick={onClickPlay}>
          {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
        </Button>
      </Space>
    </VideoControls>
  );
};
