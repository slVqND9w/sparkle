import React, { useCallback } from "react";
import classNames from "classnames";
import Video, {
  AudioTrackPublication,
  VideoTrackPublication,
} from "twilio-video";

import { DEFAULT_CAMERA_ENABLED } from "settings";

import { ContainerClassName } from "types/utility";

import { VideoOverlayButton } from "components/atoms/VideoOverlayButton";
import { VideoOverlayButtonVariant } from "components/atoms/VideoOverlayButton/VideoOverlayButton";

import "./CameraMicrophoneControls.scss";

export interface CameraMicrophoneControlsProps extends ContainerClassName {
  participant: Video.Participant;
  defaultMute: boolean;
}

export const CameraMicrophoneControls: React.FC<CameraMicrophoneControlsProps> = ({
  participant,
  defaultMute,
  containerClassName,
}) => {
  const changeStateHandler = useCallback(
    (
      variant: Extract<VideoOverlayButtonVariant, "microphone" | "camera">,
      enable: boolean
    ) => {
      const tracks =
        variant === "microphone"
          ? participant.audioTracks
          : participant.videoTracks;

      tracks.forEach((track: AudioTrackPublication | VideoTrackPublication) => {
        const innerTrack = track.track;
        if (innerTrack && "enable" in innerTrack) innerTrack.enable(enable);
      });
    },
    [participant.audioTracks, participant.videoTracks]
  );

  const changeAudioState = useCallback(
    (enabled: boolean) => changeStateHandler("microphone", enabled),
    [changeStateHandler]
  );

  const changeVideoState = useCallback(
    (enabled: boolean) => changeStateHandler("camera", enabled),
    [changeStateHandler]
  );

  return (
    <div className={classNames("CameraMicrophoneControls", containerClassName)}>
      <VideoOverlayButton
        variant="microphone"
        onEnabledChanged={changeAudioState}
        defaultValue={!defaultMute}
      />
      <VideoOverlayButton
        variant="camera"
        onEnabledChanged={changeVideoState}
        defaultValue={DEFAULT_CAMERA_ENABLED}
      />
    </div>
  );
};
