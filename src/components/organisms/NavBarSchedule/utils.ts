import { DEFAULT_VENUE_LOGO } from "settings";

import { MyPersonalizedSchedule, User } from "types/User";
import { AnyVenue, ScheduledVenueEvent, VenueEvent } from "types/venues";

import { WithId, WithVenueId } from "utils/id";
import { arrayIncludes } from "utils/types";

interface UserWithVenueIdProps extends WithId<User> {
  venueId?: string;
}
export interface PrepareForScheduleProps {
  usersEvents: MyPersonalizedSchedule;
  relatedVenues: WithId<AnyVenue>[];
  recentRoomUsers?: UserWithVenueIdProps[];
  index?: number;
}

export const prepareForSchedule = ({
  usersEvents,
  relatedVenues = [],
  recentRoomUsers,
  index = 0,
}: PrepareForScheduleProps) => (
  event: WithVenueId<VenueEvent>
): ScheduledVenueEvent => {
  return {
    ...event,
    isSaved: arrayIncludes(usersEvents[event.venueId], event.id),
    venueIcon:
      relatedVenues.find((venue) => venue.id === event.venueId)?.host?.icon ??
      DEFAULT_VENUE_LOGO,
    liveAudience: recentRoomUsers?.length ?? 0,
    orderPriority: event.orderPriority ?? 0,
  };
};
