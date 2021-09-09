import React from "react";
import { Button, Modal } from "react-bootstrap";

import { Portal } from "types/rooms";

import "./RoomInfoModal.scss";

export interface VenueRoomItemInfoModalProps {
  onAdd: () => void;
  onHide: () => void;
  show: boolean;
  portal: Portal;
}

export const RoomInfoModal: React.FC<VenueRoomItemInfoModalProps> = ({
  onAdd,
  onHide,
  show,
  portal: { description, poster, text },
}) => (
  <Modal
    centered
    dialogClassName="RoomInfoModal RoomInfoModal__dialog"
    onHide={onHide}
    show={show}
  >
    <Modal.Title className="RoomInfoModal__title">{text}</Modal.Title>
    <Modal.Body className="RoomInfoModal__body">
      {poster && (
        <img className="RoomInfoModal__poster" alt={text} src={poster} />
      )}

      <div className="RoomInfoModal__description">{description}</div>
    </Modal.Body>
    <Modal.Footer className="RoomInfoModal__footer">
      <Button
        className="RoomInfoModal__button-add"
        title="Add room"
        type="submit"
        onClick={() => onAdd()}
      >
        Add
      </Button>
    </Modal.Footer>
  </Modal>
);
