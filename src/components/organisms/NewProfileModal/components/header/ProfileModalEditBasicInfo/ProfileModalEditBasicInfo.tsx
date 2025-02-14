import React, { useCallback } from "react";
import { FieldError, useForm } from "react-hook-form";
import { useToggle } from "react-use";
import classNames from "classnames";

import { DISPLAY_NAME_MAX_CHAR_COUNT } from "settings";

import { User } from "types/User";
import { ContainerClassName } from "types/utility";

import { WithId } from "utils/id";
import { userProfileModalFormProp as formProp } from "utils/propName";

import { ProfileModalAvatar } from "components/organisms/NewProfileModal/components/header/ProfileModalAvatar";
import { ProfileModalInput } from "components/organisms/NewProfileModal/components/ProfileModalInput";

import { DefaultAvatars } from "components/molecules/DefaultAvatars/DefaultAvatars";

import "./ProfileModalEditBasicInfo.scss";

export interface ProfileModalEditBasicInfoProps extends ContainerClassName {
  user: WithId<User>;
  venueId: string;
  register: ReturnType<typeof useForm>["register"];
  setValue: ReturnType<typeof useForm>["setValue"];
  watch: ReturnType<typeof useForm>["watch"];
  partyNameError?: FieldError;
}

export const ProfileModalEditBasicInfo: React.FC<ProfileModalEditBasicInfoProps> = ({
  user,
  venueId,
  register,
  setValue,
  watch,
  partyNameError,
  containerClassName,
}) => {
  const pictureUrl = watch?.(formProp("pictureUrl"));
  const setPictureUrl = useCallback(
    (url: string) => {
      if (setValue) setValue(formProp("pictureUrl"), url, true);
    },
    [setValue]
  );

  const [isShowDefaults, toggleDefaults] = useToggle(false);

  return (
    <div
      className={classNames("ProfileModalEditBasicInfo", containerClassName)}
    >
      <ProfileModalAvatar
        user={user}
        editMode={true}
        setPictureUrl={setPictureUrl}
        pictureUrl={pictureUrl}
        register={register}
      />
      <div
        className={classNames("ProfileModalEditBasicInfo__party-name-section")}
      >
        {register && (
          <>
            <ProfileModalInput
              name={formProp("partyName")}
              placeholder="Display Name"
              error={partyNameError}
              ref={register({
                required: "Display Name cannot be empty",
                maxLength: {
                  value: DISPLAY_NAME_MAX_CHAR_COUNT,
                  message: `Display name must be ${DISPLAY_NAME_MAX_CHAR_COUNT} characters or less`,
                },
              })}
              notCondensed
            />
            <div
              className="ProfileModalEditBasicInfo__choose-text"
              onClick={toggleDefaults}
            >
              Choose a default sparkle pic
            </div>
          </>
        )}
      </div>
      <DefaultAvatars
        containerClassName={classNames(
          "ProfileModalEditBasicInfo__default-pictures",
          { "ProfileModalEditBasicInfo--hidden": !isShowDefaults }
        )}
        avatarClassName="ProfileModalEditBasicInfo__avatar"
        venueId={venueId}
        onAvatarClick={setPictureUrl}
      />
    </div>
  );
};
