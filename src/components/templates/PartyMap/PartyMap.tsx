import React, { useCallback, useMemo, useState } from "react";

import { COVERT_ROOM_TYPES } from "settings";

import { Room } from "types/rooms";
import { PartyMapVenue } from "types/venues";

import {
  eventsByStartUtcSecondsSorter,
  isEventLiveOrFuture,
} from "utils/event";
import { getLastUrlParam, isExternalUrl } from "utils/url";

import { useVenueEvents } from "hooks/events";
import { useRelatedVenues } from "hooks/useRelatedVenues";
import { useRecentVenueUsers } from "hooks/users";
import { useUser } from "hooks/useUser";

import SparkleFairiesPopUp from "components/molecules/SparkleFairiesPopUp/SparkleFairiesPopUp";

import { Map, RoomModal } from "./components";

import "./PartyMap.scss";

export interface PartyMapProps {
  venue: PartyMapVenue;
}

export const PartyMap: React.FC<PartyMapProps> = ({ venue }) => {
  const { user, profile } = useUser();
  const { recentVenueUsers } = useRecentVenueUsers({ venueName: venue.name });

  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  const hasSelectedRoom = !!selectedRoom;

  const isNotExternalLink = useMemo(
    () => !isExternalUrl(selectedRoom?.url ?? ""),
    [selectedRoom]
  );
  const isExternalLink = useMemo(
    () => !isExternalUrl(selectedRoom?.url ?? ""),
    [selectedRoom]
  );

  const venueId = useMemo(() => {
    if (hasSelectedRoom) {
      const roomVenueId = isExternalLink
        ? venue.id
        : getLastUrlParam(selectedRoom?.url ?? "")[0];
      return roomVenueId;
    } else {
      return venue.id;
    }
  }, [hasSelectedRoom, selectedRoom?.url, isExternalLink, venue]);

  const { relatedVenues: selectedRoomRelatedVenues } = useRelatedVenues({
    currentVenueId: venueId,
  });

  const selectedRoomselfAndChildVenueIds = useMemo(
    () => selectedRoomRelatedVenues.map((childVenue) => childVenue.id),
    [selectedRoomRelatedVenues]
  );

  const { events: selectedRoomEventsSelfAndChildVenueEvents } = useVenueEvents({
    venueIds: selectedRoomselfAndChildVenueIds,
  });

  const selectedRoomEvents = useMemo(() => {
    if (!selectedRoomEventsSelfAndChildVenueEvents || !selectedRoom) return [];

    return selectedRoomEventsSelfAndChildVenueEvents
      .filter(
        (event) =>
          (event.room === selectedRoom.title ||
            (isNotExternalLink &&
              selectedRoomselfAndChildVenueIds.includes(event.venueId))) &&
          isEventLiveOrFuture(event)
      )
      .sort(eventsByStartUtcSecondsSorter);
  }, [
    selectedRoomEventsSelfAndChildVenueEvents,
    selectedRoomselfAndChildVenueIds,
    isNotExternalLink,
    selectedRoom,
  ]);

  const selectRoom = useCallback((room: Room) => {
    if (room.type && COVERT_ROOM_TYPES.includes(room.type)) return;

    setSelectedRoom(room);
  }, []);

  const unselectRoom = useCallback(() => {
    setSelectedRoom(undefined);
  }, []);

  if (!user || !profile) return <>Loading..</>;

  return (
    <div className="party-venue-container">
      <Map
        user={user}
        profileData={profile.data}
        venue={venue}
        partygoers={recentVenueUsers}
        selectRoom={selectRoom}
        unselectRoom={unselectRoom}
      />

      <RoomModal
        room={selectedRoom}
        venue={venue}
        venueEvents={selectedRoomEvents}
        show={hasSelectedRoom}
        onHide={unselectRoom}
      />

      {venue.config?.showRangers && (
        <div className="sparkle-fairies">
          <SparkleFairiesPopUp />
        </div>
      )}
    </div>
  );
};
