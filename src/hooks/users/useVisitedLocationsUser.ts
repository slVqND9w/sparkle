import { skipToken } from "@reduxjs/toolkit/dist/query/react";

import { useWorldUsersQueryState } from "store/api";

import { User } from "types/User";

import { WithId } from "utils/id";
import { normalizeTimestampToMilliseconds } from "utils/time";
import { getUserLocationData } from "utils/user";

import { useUserLastSeenThreshold } from "hooks/useUserLastSeenThreshold";

import { useWorldUsersContext } from "./useWorldUsers";

export interface RecentLocationUsersData {
  isRecentLocationUsersLoaded: boolean;
  recentLocationUsers: readonly WithId<User>[][];
}

/**
 * @description this hook's filtering world users based on their @lastSeenIn location
 *
 * @param locationName is a key for `lastSeenIn` firestore field in user's object
 *
 * @example useVisitedLocationsUser(venue.name)
 * @example useVisitedLocationsUser(`${venue.name}/${roomTitle}`)
 *
 * @debt the only difference between this and useRecentWorldUsers is that useRecentWorldUsers checks
 *   userLocation.lastSeenAt, whereas useVisitedLocationsUser checks userLocation.lastSeenIn[locationName]
 *   Can we cleanly refactor them into a single hook somehow to de-duplicate the logic?
 */
export const useVisitedLocationsUser = ({
  locationNames,
}: {
  locationNames?: string[];
}): RecentLocationUsersData => {
  const lastSeenThreshold = useUserLastSeenThreshold();
  // We mostly use this here to ensure that the WorldUsersProvider has definitely been connected
  const { worldUsersApiArgs } = useWorldUsersContext();
  const {
    isSuccess: isRecentLocationUsersLoaded,
    recentLocationUsers,
  } = useWorldUsersQueryState(worldUsersApiArgs ?? skipToken, {
    selectFromResult: ({
      isSuccess,
      data: { worldUsers, worldUserLocationsById } = {},
    }) => {
      if (!worldUsers || !worldUserLocationsById || !locationNames)
        return { isSuccess, recentLocationUsers: [] };

      const recentLocationUsers = locationNames?.map((location) => {
        const [parentLocation, childLocation] = location.split("/");
        const result = worldUsers
          .filter((user) => {
            const {
              isLocationMatch,
              userLastSeenLocation,
            } = getUserLocationData({
              worldUserLocationsById,
              user,
              location,
              roomName: childLocation.trim(),
              venueName: parentLocation.trim(),
            });

            return (
              isLocationMatch &&
              normalizeTimestampToMilliseconds(userLastSeenLocation) >
                lastSeenThreshold
            );
          })
          .map((user) => ({
            ...user,
            venueId: parentLocation,
            portalId: childLocation,
          }));
        return result;
      });

      return {
        isSuccess,
        recentLocationUsers,
      };
    },
  });

  return {
    isRecentLocationUsersLoaded,
    recentLocationUsers,
  };
};
