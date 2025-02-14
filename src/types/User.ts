// @debt rename this file to be user rather than User

import * as Yup from "yup";

export interface Experience {
  // @debt refactor bartender to be potentially undefined. Or can we remove it entirely?
  bartender: User;
  table?: string | null;
  row?: number | null;
  column?: number | null;
  sectionId?: string;
}

// @debt typing I think this is correct from Room.tsx, need to confirm
// @debt This should probably be Partial<Record<string, Experience>> as otherwise it implies that an entry exists
//   for literally any arbitrary string
export type UserExperienceData = Record<string, Experience>;

// Store all things related to video chat where they can't be tampered with by other users
export type VideoState = {
  inRoomOwnedBy?: string;
  removedParticipantUids?: string[];
};

// the structure is { [key: venueId] : eventId[] }
export type MyPersonalizedSchedule = Partial<Record<string, string[]>>;

export interface ProfileLink {
  title: string;
  url: string;
}

export interface BaseUser {
  partyName?: string;
  pictureUrl?: string;
  anonMode?: boolean;
  mirrorVideo?: boolean;
  status?: string;
  data?: UserExperienceData;
  myPersonalizedSchedule?: MyPersonalizedSchedule;
  profileLinks?: ProfileLink[];

  // @debt typing - user also has a dynamic set of attributes for the question answers
  //   currently not possible to type them properly
  // [question: string]: string;

  // @debt these types are legacy and should be cleaned up across the codebase
  room?: string; // @debt: is this valid/used anymore? Use in JazzBarTableComponent, ProfileModal
  video?: VideoState; // @debt: is this valid/used anymore? Used in FireBarrel, Playa (Avatar, AvatarLayer, AvatarPartygoers, MyAvatar, Playa, VideoChatLayer
  kidsMode?: boolean; // @debt: is this valid/used anymore? Used in UserInformationContent, Playa
  // @debt these don't appear to be used by anything anymore
  // drinkOfChoice?: string;
  // favouriteRecord?: string;
  // doYouDance?: string;
}

export interface User extends BaseUser {
  lastSeenIn?: never;
  lastSeenAt?: never;
}

export interface UserStatus {
  status: string;
  color: string;
}

export interface UserLocation {
  lastSeenIn: { [key: string]: number };
  lastSeenAt: number;
  enteredVenueIds?: string[];
}

export type UserWithLocation = BaseUser & UserLocation;

export enum UsernameVisibility {
  none = "none",
  hover = "hover",
  inline = "inline",
}

export const VideoStateSchema: Yup.ObjectSchema<VideoState> = Yup.object()
  .shape({
    inRoomOwnedBy: Yup.string(),
    removedParticipantUids: Yup.array().of(Yup.string().required()),
  })
  .required();

export const MyPersonalizedScheduleSchema = Yup.lazy<
  MyPersonalizedSchedule | undefined
>((data) => {
  const lazyObjectShape = Object.fromEntries(
    Object.keys(data ?? {}).map((key) => [
      key,
      Yup.array().of(Yup.string().required()),
    ])
  );

  return Yup.object().shape(lazyObjectShape).noUnknown();
});
