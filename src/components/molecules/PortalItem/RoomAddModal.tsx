import React from "react";
import { Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useAsyncFn } from "react-use";

import { DEFAULT_VENUE_LOGO } from "settings";

import {
  createRoom,
  CreateRoomResult,
  createVenue_v2,
  RoomInput_v2,
} from "api/admin";

import { PortalTemplate } from "types/rooms";
import { VenueTemplate } from "types/venues";

import { venueInsideUrl } from "utils/url";
import { buildEmptyVenue } from "utils/venue";

import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";

import {
  roomSchema,
  venueRoomSchema,
} from "pages/Admin/Details/ValidationSchema";

import { ButtonNG } from "components/atoms/ButtonNG/ButtonNG";
import { InputField } from "components/atoms/InputField";

import "./RoomAddModal.scss";

export interface RoomAddModalProps {
  onAdd: (result: CreateRoomResult) => void;
  onHide: () => void;
  show: boolean;
  template: VenueTemplate | PortalTemplate;
}

export const RoomAddModal: React.FC<RoomAddModalProps> = ({
  onAdd,
  onHide,
  show,
  template,
}) => {
  const isVenuePortal = template !== PortalTemplate.external;

  const venueId = useVenueId();

  const { user } = useUser();

  const { register, getValues, handleSubmit, errors } = useForm({
    validationSchema: isVenuePortal ? venueRoomSchema : roomSchema,
    defaultValues: {
      roomTitle: "",
      roomUrl: "",
      venueName: "",
      template: template,
    },
  });

  const [{ loading: isLoading }, addRoom] = useAsyncFn(async () => {
    if (!user || !venueId || !template) return;

    const roomValues = getValues();

    const roomUrl = isVenuePortal
      ? window.origin + venueInsideUrl(roomValues.venueName)
      : roomValues.roomUrl;

    const roomData: RoomInput_v2 = {
      title: roomValues.roomTitle,
      isEnabled: true,
      image_url: DEFAULT_VENUE_LOGO,
      url: roomUrl,
      template,
    };

    // TS doesn't work properly with const statements and won't 'know' that this is already checked.
    // That's why this is inline instead of isVenuePortal
    if (template !== PortalTemplate.external) {
      const venueData = buildEmptyVenue(roomValues.venueName, template);

      await createVenue_v2(venueData, user);
    }

    await createRoom(roomData, venueId, user).then(onAdd);
  }, [getValues, onAdd, isVenuePortal, template, user, venueId]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="RoomAddModal RoomAddModal__dialog"
    >
      <Modal.Body>
        <Form onSubmit={handleSubmit(addRoom)}>
          <Modal.Body className="RoomAddModal__body">
            <Form.Label className="RoomAddModal__label">Room title</Form.Label>
            <InputField
              containerClassName="RoomAddModal__input"
              name="roomTitle"
              type="text"
              autoComplete="off"
              placeholder="Room title"
              error={errors.roomTitle}
              ref={register()}
              disabled={isLoading}
            />
            {isVenuePortal && (
              <>
                <Form.Label className="RoomAddModal__label">
                  Venue name
                </Form.Label>
                <InputField
                  containerClassName="RoomAddModal__input"
                  name="venueName"
                  type="text"
                  autoComplete="off"
                  placeholder="Venue name"
                  error={errors.venueName}
                  ref={register()}
                  disabled={isLoading}
                />
              </>
            )}

            {!isVenuePortal && (
              <>
                <Form.Label className="RoomAddModal__label">
                  Room url
                </Form.Label>
                <InputField
                  containerClassName="RoomAddModal__input"
                  name="roomUrl"
                  type="text"
                  autoComplete="off"
                  placeholder="Room url"
                  error={errors.roomUrl}
                  ref={register()}
                  disabled={isLoading}
                />
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="RoomAddModal__footer">
            <ButtonNG
              className="RoomAddModal__button-add"
              disabled={isLoading}
              title="Add room"
              type="submit"
              variant="primary"
            >
              Add room
            </ButtonNG>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
