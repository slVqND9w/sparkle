import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAsyncFn } from "react-use";
import { isEqual } from "lodash";

import { RoomInput_v2, updateRoom } from "api/admin";

import { RoomData_v2 } from "types/rooms";

import { useUser } from "hooks/useUser";

import {
  Container,
  SubVenueIconMap,
} from "pages/Account/Venue/VenueMapEdition/Container";

import { ButtonNG } from "components/atoms/ButtonNG/ButtonNG";
import Legend from "components/atoms/Legend";

import { BackgroundSelect } from "../BackgroundSelect";

import "./MapPreview.scss";

export interface MapPreviewProps {
  venueName: string;
  mapBackground?: string;
  rooms: RoomData_v2[];
  venueId: string;
  isEditing: boolean;
  onRoomChange?: (rooms: RoomData_v2[]) => void;
}

const MapPreview: React.FC<MapPreviewProps> = ({
  venueName,
  mapBackground,
  rooms,
  venueId,
  isEditing,
  onRoomChange,
}) => {
  const { user } = useUser();
  const [mapRooms, setMapRooms] = useState<RoomData_v2[]>([]);

  useEffect(() => {
    if (
      !mapRooms.length ||
      !isEqual(rooms.length, mapRooms.length) ||
      !isEditing
    ) {
      setMapRooms(rooms);
    }
  }, [isEditing, mapRooms, rooms]);

  const roomRef = useRef<SubVenueIconMap>({});

  const iconsMap = useMemo(() => {
    const iconsRooms = isEditing || mapRooms.length ? mapRooms : rooms;
    return iconsRooms.map((room, index: number) => ({
      title: room.title,
      width: room.width_percent,
      height: room.height_percent,
      top: room.y_percent,
      left: room.x_percent,
      url: room.image_url,
      roomIndex: index,
    }));
  }, [isEditing, mapRooms, rooms]);

  const updateRoomsPosition = useCallback(
    (val: SubVenueIconMap) => {
      if (isEqual(roomRef.current, val)) return;

      roomRef.current = val;
      const normalizeRooms = Object.values(val).map(
        ({ left, top, width, height }, index) => ({
          ...rooms[index],
          x_percent: left,
          y_percent: top,
          width_percent: width,
          height_percent: height,
        })
      );
      setMapRooms(normalizeRooms);
      onRoomChange?.(normalizeRooms);
    },
    [onRoomChange, rooms]
  );

  const [{ loading: isSaving }, saveRoomPositions] = useAsyncFn(async () => {
    if (isSaving || !user) return;

    // Why is this using the ref and not mapRooms state?
    const updatedRooms = Object.values(roomRef.current);

    // Remove after forEach implementation is added.
    let roomIndex = 0;

    // Ideally this should be using forEach and promise all to send all of the requests at once, instead of 1 by 1
    // Using forEach will also allow us to use the index param and get rid of roomIndex and it's incremention
    for (const { left, top, width, height } of updatedRooms) {
      const room: RoomInput_v2 = {
        ...rooms[roomIndex],
        x_percent: left,
        y_percent: top,
        width_percent: width,
        height_percent: height,
      };

      // Requests are triggered one by one instead of bulk at once.
      await updateRoom(room, venueId, user, roomIndex);

      roomIndex += 1;
    }
  }, [rooms, user, venueId]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="MapPreview">
        <Legend text={`${venueName}'s Map`} />

        {!isEditing && (
          <BackgroundSelect
            venueName={venueName}
            mapBackground={mapBackground}
          />
        )}

        {mapBackground &&
          !isEditing &&
          mapRooms.map((room) => (
            <div
              key={room.title}
              style={{
                position: "absolute",
                top: `${room.y_percent}%`,
                left: `${room.x_percent}%`,
                width: `${room.width_percent}%`,
                height: `${room.height_percent}%`,
              }}
            >
              <img
                style={{
                  width: "100%",
                  height: "100%",
                  filter: room.isEnabled ? "none" : "grayscale(100%)",
                  opacity: room.isEnabled ? 1 : 0.5,
                  transition: "filter .3s ease",
                }}
                src={room.image_url}
                alt="room banner"
                title={room.title}
              />
            </div>
          ))}

        {mapBackground && isEditing && (
          <Container
            interactive
            resizable
            onChange={updateRoomsPosition}
            backgroundImage={mapBackground}
            otherIcons={{}}
            // @debt It probably doesn't work as iconsMap is an array and SubVenueIconMap object is expected
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            iconsMap={iconsMap}
            coordinatesBoundary={{
              width: 100,
              height: 100,
            }}
            otherIconsStyle={{ opacity: 0.4 }}
            lockAspectRatio
            isSaving={isSaving}
          />
        )}

        <ButtonNG
          className="MapPreview__save-button"
          disabled={isSaving}
          loading={isSaving}
          onClick={saveRoomPositions}
        >
          Save rooms
        </ButtonNG>
      </div>
    </DndProvider>
  );
};

export default MapPreview;
