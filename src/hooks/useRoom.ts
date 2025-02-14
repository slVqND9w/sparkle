import { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";

import { Room } from "types/rooms";

import { getExternalRoomSlug } from "utils/room";
import { enterVenue } from "utils/url";
import { enterExternalRoom } from "utils/userLocation";

import { useRelatedVenues } from "hooks/useRelatedVenues";
import { useRecentLocationUsers } from "hooks/users";
import { useUser } from "hooks/useUser";

export interface UseRoomProps {
  room?: Room;
  venueName: string;
}
// @debt refactor useRoom to take venueId instead of venueName
export const useRoom = ({ room, venueName }: UseRoomProps) => {
  const { user } = useUser();
  const userId = user?.uid;

  const roomUrl = room?.url ?? "";

  const { push: openUrlUsingRouter } = useHistory();

  // @debt pass venueId taken from UseRoomProps through to useRelatedVenues
  const { relatedVenues } = useRelatedVenues({});

  const roomVenue = useMemo(
    () => relatedVenues.find((venue) => roomUrl.endsWith(`/${venue.id}`)),
    [roomUrl, relatedVenues]
  );

  // @debt we should replace externalRoomSlug with preferrably room id
  const roomSlug = roomVenue
    ? roomVenue.name
    : getExternalRoomSlug({ roomTitle: room?.title, venueName });

  const { recentLocationUsers } = useRecentLocationUsers({
    locationName: roomSlug,
  });

  const enterRoom = useCallback(() => {
    if (!userId) return;

    roomVenue
      ? enterVenue(roomVenue.id, { customOpenRelativeUrl: openUrlUsingRouter })
      : enterExternalRoom({ userId, roomUrl, locationName: roomSlug });
  }, [roomSlug, roomUrl, userId, roomVenue, openUrlUsingRouter]);

  return {
    enterRoom,
    recentRoomUsers: recentLocationUsers,
  };
};
