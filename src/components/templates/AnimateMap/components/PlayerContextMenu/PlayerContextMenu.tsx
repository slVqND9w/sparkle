import React, { useCallback, useEffect } from "react";

import { ReplicatedUser } from "store/reducers/AnimateMap";

import { useProfileModalControls } from "hooks/useProfileModalControls";

import EventProvider, {
  EventType,
} from "../../bridges/EventProvider/EventProvider";

import "./PlayerContextMenu.scss";
export interface UIContextMenuProps {}

export const UIPlayerClickHandler: React.FC<UIContextMenuProps> = () => {
  const { openUserProfileModal } = useProfileModalControls();

  const viewProfileHandler = useCallback(
    (user: ReplicatedUser, viewportX: number, viewportY: number) => {
      openUserProfileModal(user.data);
    },
    [openUserProfileModal]
  );

  useEffect(() => {
    EventProvider.on(EventType.ON_REPLICATED_USER_CLICK, viewProfileHandler);
    return () => {
      EventProvider.off(EventType.ON_REPLICATED_USER_CLICK, viewProfileHandler);
    };
  }, [viewProfileHandler]);

  return <div />;
};
