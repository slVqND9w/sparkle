import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFirebase } from "react-redux-firebase";
import Bugsnag from "@bugsnag/js";
import Video from "twilio-video";

import { getTwilioVideoToken } from "api/video";

import { User } from "types/User";
import { AnimateMapVenue } from "types/venues";

import { WithId } from "utils/id";

import { useWorldUsersById } from "hooks/users";
import { useUser } from "hooks/useUser";

import { LocalParticipant } from "components/organisms/Room/LocalParticipant";
import { Participant } from "components/organisms/Room/Participant";
import VideoErrorModal from "components/organisms/Room/VideoErrorModal";

import { Button } from "components/atoms/Button";

import "./FirebarrelWidget.scss";

const NUM_OF_SIDED_USERS_MINUS_ONE = 3;

export interface FirebarrelWidgetProps {
  venue: AnimateMapVenue;
  roomName: string;
  onEnter: (roomId: string, val: User[]) => void;
  onExit: (roomId: string) => void;
  setUserList: (roomId: string, val: User[]) => void;
  onBack?: () => void;
  hasChairs?: boolean;
  defaultMute?: boolean;
  isAudioEffectDisabled: boolean;
}

// @debt THIS COMPONENT IS THE COPY OF components/molecules/TableComponent
// The reason to copy it was the lack of time to refactor the whole thing, so the
// safest approch (not to break other Venues that rely on TableComponent) is to copy this component
// It needs to get deleted in the future
export const FirebarrelWidget: React.FC<FirebarrelWidgetProps> = ({
  venue,
  roomName,
  setUserList,
  onEnter,
  onExit,
  defaultMute,
  isAudioEffectDisabled,
}) => {
  const [room, setRoom] = useState<Video.Room>();
  const [videoError, setVideoError] = useState<string>("");
  const [participants, setParticipants] = useState<Array<Video.Participant>>(
    []
  );

  const { user } = useUser();
  const { worldUsersById } = useWorldUsersById();
  const [token, setToken] = useState<string>();
  const firebase = useFirebase();

  const userFriendlyVideoError = (originalMessage: string) => {
    if (originalMessage.toLowerCase().includes("unknown")) {
      return `${originalMessage}; common remedies include closing any other programs using your camera, and giving your browser permission to access the camera.`;
    }
    return originalMessage;
  };

  const disconnect = () => {
    if (room && room.localParticipant.state === "connected") {
      room.localParticipant.tracks.forEach((trackPublication) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignored
        trackPublication.track.stop(); //@debt typing does this work?
      });
      room.disconnect();
      setRoom(undefined);
    }
  };

  const getUserList = (
    room: Video.Room | undefined,
    participants: Video.Participant[],
    worldUsersById: Record<string, WithId<User>>
  ) => {
    return room ? [...participants.map((p) => worldUsersById[p.identity])] : [];
  };

  // @debt refactor this to use useAsync or similar?
  useEffect(() => {
    if (!user) return;

    getTwilioVideoToken({
      userId: user.uid,
      roomName,
    }).then((token) => {
      setToken(token);
    });
  }, [firebase, roomName, user]);

  const convertRemoteParticipantToLocal = (
    localParticipant: Video.LocalParticipant | undefined,
    participants: Map<string, Video.RemoteParticipant> | undefined
  ) => {
    const result: Video.Participant[] = [];

    if (localParticipant) {
      result.push(localParticipant as Video.Participant);
    }

    if (participants) {
      for (const key of Array.from(participants.keys())) {
        const participant = participants.get(key);
        if (participant) {
          result.push(participant as Video.Participant);
        }
      }
    }

    return result;
  };

  const connectToVideoRoom = () => {
    if (!token || room) return;

    setVideoError("");

    Video.connect(token, {
      name: roomName,
    })
      .then((room) => {
        console.log("connect to room", room);
        setRoom(room);

        const users = getUserList(
          room,
          convertRemoteParticipantToLocal(
            room?.localParticipant,
            room?.participants
          ),
          worldUsersById
        );
        onEnter(roomName, users);
        //@debt refactor this
        firebase
          .firestore()
          .collection("venues")
          .doc(venue.id)
          .collection("firebarrels")
          .doc(roomName)
          .update({ connectedUsers: users.map((user) => user.id) });
      })
      .catch((error) => {
        console.error("error connect to room", error.message);
        setVideoError(userFriendlyVideoError(error.message));
      });
  };

  useEffect(() => {
    if (!token || room) return;

    const participantConnected = (participant: Video.Participant) => {
      setParticipants((prevParticipants) => [
        // Hopefully prevents duplicate users in the participant list
        ...prevParticipants.filter((p) => p.identity !== participant.identity),
        participant,
      ]);
    };

    const participantDisconnected = (participant: Video.Participant) => {
      setParticipants((prevParticipants) => {
        if (!prevParticipants.find((p) => p === participant)) {
          // @debt Remove when root issue found and fixed
          console.error(
            "Could not find disconnnected participant:",
            participant
          );
          Bugsnag.notify(
            new Error("Could not find disconnnected participant"),
            (event) => {
              const { identity, sid } = participant;
              event.addMetadata("Room::participantDisconnected", {
                identity,
                sid,
              });
            }
          );
        }
        return prevParticipants.filter((p) => p !== participant);
      });
    };

    Video.connect(token, {
      name: roomName,
    })
      .then((room) => {
        console.log("connect", room, room.localParticipant.state);
        setRoom(room);

        room.on("participantConnected", participantConnected);
        room.on("participantDisconnected", participantDisconnected);
        room.participants.forEach(participantConnected);

        const users = getUserList(
          room,
          convertRemoteParticipantToLocal(
            room?.localParticipant,
            room?.participants
          ),
          worldUsersById
        );
        onEnter(roomName, users);
        //@debt refactor this
        firebase
          .firestore()
          .collection("venues")
          .doc(venue.id)
          .collection("firebarrels")
          .doc(roomName)
          .update({ connectedUsers: users.map((user) => user.id) });
      })
      .catch((error) => setVideoError(error.message));
    // note: we really doesn't need rerender this for others dependencies
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, token]);

  useEffect(() => {
    if (!room) return;
    const users = getUserList(
      room,
      convertRemoteParticipantToLocal(
        room?.localParticipant,
        room?.participants
      ),
      worldUsersById
    );
    setUserList(roomName, users); //FIXME: not call sometimes
    // note: we really doesn't need rerender this for others dependencies
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, worldUsersById]);

  const getIsUserBartender = (userIdentity?: string) => {
    if (!userIdentity) return;
    return worldUsersById?.[userIdentity]?.data?.[roomName]?.bartender;
  };

  // Ordering of participants:
  // 1. Me
  // 2. Bartender, if found (only one allowed)
  // 3. Rest of the participants, in order

  // Only allow the first bartender to appear as bartender
  const userIdentity = room?.localParticipant?.identity;

  const meIsBartender = getIsUserBartender(userIdentity);

  // Video stream and local participant take up 2 slots
  // Ensure capacity is always even, so the grid works

  const profileData = room
    ? worldUsersById[room.localParticipant.identity]
    : undefined;

  const [sidedVideoParticipants, otherVideoParticipants] = useMemo(() => {
    const sidedVideoParticipants = participants.slice(
      0,
      NUM_OF_SIDED_USERS_MINUS_ONE
    );

    const otherVideoParticipants = participants.slice(
      NUM_OF_SIDED_USERS_MINUS_ONE
    );

    return [sidedVideoParticipants, otherVideoParticipants];
  }, [participants]);

  const sidedVideos = useMemo(
    () =>
      sidedVideoParticipants.map((participant) => {
        if (!participant) {
          return null;
        }

        const bartender = meIsBartender
          ? worldUsersById[participant.identity]?.data?.[roomName]?.bartender
          : undefined;

        return (
          <div
            key={participant.identity}
            className="firebarrel-room__participant"
          >
            <Participant
              participant={participant}
              profileData={worldUsersById[participant.identity]}
              profileDataId={participant.identity}
              bartender={bartender}
            />
          </div>
        );
      }),
    [sidedVideoParticipants, meIsBartender, worldUsersById, roomName]
  );

  const otherVideos = useMemo(
    () =>
      otherVideoParticipants.map((participant) => {
        if (!participant) {
          return null;
        }

        const bartender = meIsBartender
          ? worldUsersById[participant.identity]?.data?.[roomName]?.bartender
          : undefined;

        return (
          <div
            key={participant.identity}
            className="firebarrel-room__participant"
          >
            <Participant
              participant={participant}
              profileData={worldUsersById[participant.identity]}
              profileDataId={participant.identity}
              bartender={bartender}
            />
          </div>
        );
      }),
    [otherVideoParticipants, meIsBartender, worldUsersById, roomName]
  );

  const myVideo = useMemo(() => {
    return room && profileData ? (
      <div className="firebarrel-room__participant">
        <LocalParticipant
          key={room.localParticipant.sid}
          participant={room.localParticipant}
          profileData={profileData}
          profileDataId={room.localParticipant.identity}
          bartender={meIsBartender}
          defaultMute={defaultMute}
          isAudioEffectDisabled={isAudioEffectDisabled}
        />
      </div>
    ) : null;
  }, [meIsBartender, room, profileData, defaultMute, isAudioEffectDisabled]);

  const onExitClick = useCallback(() => {
    const users = getUserList(
      room,
      convertRemoteParticipantToLocal(
        room?.localParticipant,
        room?.participants
      ),
      worldUsersById
    );
    if (!users || users.length <= 1) {
      //@debt rewrite this hardcode
      firebase
        .firestore()
        .collection("venues")
        .doc(venue.id)
        .collection("firebarrels")
        .doc(roomName)
        .update({ connectedUsers: [] });
    }

    disconnect();

    if (onExit) {
      onExit(roomName);
    }
    // note: we really doesn't need rerender this for others dependencies
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onExit]);

  if (!token || !room) return null;

  return (
    <>
      <div className="firebarrel-room__exit-btn-wrapper">
        <div className="firebarrel-room__exit-btn-inner">
          <Button customClass="firebarrel-room__exit-btn" onClick={onExitClick}>
            Leave
          </Button>
        </div>
      </div>
      <div className="firebarrel-room__participants">
        <div className="firebarrel-room__exit-container" />
        {myVideo}
        {sidedVideos}
        {otherVideos}
      </div>

      <VideoErrorModal
        show={!!videoError}
        onHide={() => setVideoError("")}
        errorMessage={videoError}
        onRetry={connectToVideoRoom}
        onBack={() => {
          if (onExit) {
            onExit(roomName);
          }
        }}
      />
    </>
  );
};
