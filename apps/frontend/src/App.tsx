import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

const ROOMS_QUERY = gql`
  query RoomsDashboard {
    rooms {
      id
      name
      location
      capacity
      equipment
      status
      nextAppointment {
        id
        title
        description
        roomId
        startTime
        endTime
        participants
      }
      appointments {
        id
        title
        description
        roomId
        startTime
        endTime
        participants
      }
    }
  }
`;

const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      id
      name
      location
      capacity
      equipment
      status
    }
  }
`;

const UPDATE_ROOM_MUTATION = gql`
  mutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {
    updateRoom(id: $id, input: $input) {
      id
      name
      location
      capacity
      equipment
      status
    }
  }
`;

const DELETE_ROOM_MUTATION = gql`
  mutation DeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`;

const CREATE_APPOINTMENT_MUTATION = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      title
      description
      roomId
      startTime
      endTime
      participants
    }
  }
`;

const UPDATE_APPOINTMENT_MUTATION = gql`
  mutation UpdateAppointment($id: ID!, $input: UpdateAppointmentInput!) {
    updateAppointment(id: $id, input: $input) {
      id
      title
      description
      roomId
      startTime
      endTime
      participants
    }
  }
`;

const DELETE_APPOINTMENT_MUTATION = gql`
  mutation DeleteAppointment($id: ID!) {
    deleteAppointment(id: $id)
  }
`;

type RoomStatus = "available" | "occupied";

type Appointment = {
  id: string;
  title: string;
  description?: string | null;
  roomId: string;
  startTime: string;
  endTime: string;
  participants: string[];
};

type Room = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  status: RoomStatus;
  nextAppointment?: Appointment | null;
  appointments: Appointment[];
};

type RealtimeEvent = {
  type: string;
  payload: unknown;
  createdAt: string;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function toIsoString(value: string): string {
  return new Date(value).toISOString();
}

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function App() {
  const { data, loading, error, refetch } = useQuery<{ rooms: Room[] }>(
    ROOMS_QUERY
  );

  const [createRoom, { error: createRoomError }] = useMutation(
    CREATE_ROOM_MUTATION
  );

  const [updateRoom, { error: updateRoomError }] = useMutation(
    UPDATE_ROOM_MUTATION
  );

  const [deleteRoom, { error: deleteRoomError }] = useMutation(
    DELETE_ROOM_MUTATION
  );

  const [createAppointment, { error: createAppointmentError }] = useMutation(
    CREATE_APPOINTMENT_MUTATION
  );

  const [updateAppointment, { error: updateAppointmentError }] = useMutation(
    UPDATE_APPOINTMENT_MUTATION
  );

  const [deleteAppointment, { error: deleteAppointmentError }] = useMutation(
    DELETE_APPOINTMENT_MUTATION
  );

  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  const [roomName, setRoomName] = useState("");
  const [roomLocation, setRoomLocation] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("20");
  const [roomEquipment, setRoomEquipment] = useState("Beamer, Whiteboard");

  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDescription, setAppointmentDescription] = useState("");
  const [appointmentRoomId, setAppointmentRoomId] = useState("");
  const [appointmentStartTime, setAppointmentStartTime] = useState("");
  const [appointmentEndTime, setAppointmentEndTime] = useState("");
  const [appointmentParticipants, setAppointmentParticipants] = useState(
    "test@example.com"
  );

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomLocation, setEditRoomLocation] = useState("");
  const [editRoomCapacity, setEditRoomCapacity] = useState("");
  const [editRoomEquipment, setEditRoomEquipment] = useState("");

  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editAppointmentTitle, setEditAppointmentTitle] = useState("");
  const [editAppointmentDescription, setEditAppointmentDescription] =
    useState("");
  const [editAppointmentRoomId, setEditAppointmentRoomId] = useState("");
  const [editAppointmentStartTime, setEditAppointmentStartTime] = useState("");
  const [editAppointmentEndTime, setEditAppointmentEndTime] = useState("");
  const [editAppointmentParticipants, setEditAppointmentParticipants] =
    useState("");

  useEffect(() => {
    if (!appointmentRoomId && data?.rooms && data.rooms.length > 0) {
      setAppointmentRoomId(data.rooms[0].id);
    }
  }, [data, appointmentRoomId]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000/ws");

    socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as RealtimeEvent;

      setEvents((previousEvents) => [event, ...previousEvents].slice(0, 10));

      if (
        event.type.startsWith("ROOM_") ||
        event.type.startsWith("APPOINTMENT_")
      ) {
        const scrollY = window.scrollY;

        refetch().then(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: scrollY,
              behavior: "instant"
            });
          });
        });
      }
    };

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      socket.close();
    };
  }, [refetch]);

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const equipment = roomEquipment
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    await createRoom({
      variables: {
        input: {
          name: roomName,
          location: roomLocation,
          capacity: Number(roomCapacity),
          equipment
        }
      }
    });

    setRoomName("");
    setRoomLocation("");
    setRoomCapacity("20");
    setRoomEquipment("Beamer, Whiteboard");
  }

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const participants = appointmentParticipants
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    await createAppointment({
      variables: {
        input: {
          title: appointmentTitle,
          description: appointmentDescription,
          roomId: appointmentRoomId,
          startTime: toIsoString(appointmentStartTime),
          endTime: toIsoString(appointmentEndTime),
          participants
        }
      }
    });

    setAppointmentTitle("");
    setAppointmentDescription("");
    setAppointmentStartTime("");
    setAppointmentEndTime("");
    setAppointmentParticipants("test@example.com");
  }

  function startEditingRoom(room: Room): void {
    setEditingRoomId(room.id);
    setEditRoomName(room.name);
    setEditRoomLocation(room.location);
    setEditRoomCapacity(String(room.capacity));
    setEditRoomEquipment(room.equipment.join(", "));
  }

  function cancelEditingRoom(): void {
    setEditingRoomId(null);
    setEditRoomName("");
    setEditRoomLocation("");
    setEditRoomCapacity("");
    setEditRoomEquipment("");
  }

  async function handleUpdateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingRoomId) {
      return;
    }

    const capacity = Number(editRoomCapacity);

    if (!Number.isInteger(capacity) || capacity <= 0) {
      alert("Capacity must be a positive number.");
      return;
    }

    const equipment = editRoomEquipment
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    await updateRoom({
      variables: {
        id: editingRoomId,
        input: {
          name: editRoomName,
          location: editRoomLocation,
          capacity,
          equipment
        }
      }
    });

    cancelEditingRoom();
    await refetch();
  }

  async function handleSetRoomStatus(
    room: Room,
    status: RoomStatus
  ): Promise<void> {
    if (room.status === status) {
      return;
    }

    await updateRoom({
      variables: {
        id: room.id,
        input: {
          status
        }
      }
    });
  }

  async function handleDeleteRoom(room: Room): Promise<void> {
    await deleteRoom({
      variables: {
        id: room.id
      }
    });

    if (appointmentRoomId === room.id) {
      setAppointmentRoomId("");
    }
  }

  function startEditingAppointment(appointment: Appointment): void {
    setEditingAppointmentId(appointment.id);
    setEditAppointmentTitle(appointment.title);
    setEditAppointmentDescription(appointment.description ?? "");
    setEditAppointmentRoomId(appointment.roomId);
    setEditAppointmentStartTime(toDateTimeLocalValue(appointment.startTime));
    setEditAppointmentEndTime(toDateTimeLocalValue(appointment.endTime));
    setEditAppointmentParticipants(appointment.participants.join(", "));
  }

  function cancelEditingAppointment(): void {
    setEditingAppointmentId(null);
    setEditAppointmentTitle("");
    setEditAppointmentDescription("");
    setEditAppointmentRoomId("");
    setEditAppointmentStartTime("");
    setEditAppointmentEndTime("");
    setEditAppointmentParticipants("");
  }

  async function handleUpdateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingAppointmentId) {
      return;
    }

    const participants = editAppointmentParticipants
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    await updateAppointment({
      variables: {
        id: editingAppointmentId,
        input: {
          title: editAppointmentTitle,
          description: editAppointmentDescription,
          roomId: editAppointmentRoomId,
          startTime: toIsoString(editAppointmentStartTime),
          endTime: toIsoString(editAppointmentEndTime),
          participants
        }
      }
    });

    cancelEditingAppointment();
  }

  async function handleDeleteAppointment(
    appointment: Appointment
  ): Promise<void> {
    await deleteAppointment({
      variables: {
        id: appointment.id
      }
    });

  }

  if (loading && !data) {
  return <main className="page">Loading rooms...</main>;
  }

  if (error) {
    return (
      <main className="page">
        <h1>Campus Interaction Platform</h1>
        <p className="error">Error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header app-hero">
        <h1>Campus Interaction Platform</h1>
      </header>
      
      <section className="section section-card">
        <h2>Create Room</h2>

        <form className="form" onSubmit={handleCreateRoom}>
          <label>
            Room name
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="D1.05"
              required
            />
          </label>

          <label>
            Location
            <input
              value={roomLocation}
              onChange={(event) => setRoomLocation(event.target.value)}
              placeholder="Hochschule Mainz, Gebäude D"
              required
            />
          </label>

          <label>
            Capacity
            <input
              type="number"
              value={roomCapacity}
              onChange={(event) => setRoomCapacity(event.target.value)}
              min="1"
              required
            />
          </label>

          <label>
            Equipment
            <input
              value={roomEquipment}
              onChange={(event) => setRoomEquipment(event.target.value)}
              placeholder="Beamer, Whiteboard"
              required
            />
          </label>

          <button type="submit">Create room</button>

          {createRoomError && (
            <p className="error">Error: {createRoomError.message}</p>
          )}
        </form>
      </section>

      <section className="section section-card">
        <h2>Create Appointment</h2>

        <form className="form" onSubmit={handleCreateAppointment}>
          <label>
            Title
            <input
              value={appointmentTitle}
              onChange={(event) => setAppointmentTitle(event.target.value)}
              placeholder="AWT Projektbesprechung"
              required
            />
          </label>

          <label>
            Description
            <input
              value={appointmentDescription}
              onChange={(event) =>
                setAppointmentDescription(event.target.value)
              }
              placeholder="Besprechung zum Semesterprojekt"
            />
          </label>

          <label>
            Room
            <select
              value={appointmentRoomId}
              onChange={(event) => setAppointmentRoomId(event.target.value)}
              required
            >
              {data?.rooms.map((room: Room) => (
                <option key={room.id} value={room.id}>
                  {room.name} — {room.location}
                </option>
              ))}
            </select>
          </label>

          <label>
            Start time
            <input
              type="datetime-local"
              value={appointmentStartTime}
              onChange={(event) => setAppointmentStartTime(event.target.value)}
              required
            />
          </label>

          <label>
            End time
            <input
              type="datetime-local"
              value={appointmentEndTime}
              onChange={(event) => setAppointmentEndTime(event.target.value)}
              required
            />
          </label>

          <label>
            Participants
            <input
              value={appointmentParticipants}
              onChange={(event) =>
                setAppointmentParticipants(event.target.value)
              }
              placeholder="test@example.com, user@example.com"
              required
            />
          </label>

          <button type="submit">Create appointment</button>

          {createAppointmentError && (
            <p className="error">Error: {createAppointmentError.message}</p>
          )}
        </form>
      </section>

      <section className="section section-card">
        <h2>Rooms</h2>

        {(updateRoomError ||
          deleteRoomError ||
          updateAppointmentError ||
          deleteAppointmentError) && (
          <p className="error">
            Error:{" "}
            {updateRoomError?.message ||
              deleteRoomError?.message ||
              updateAppointmentError?.message ||
              deleteAppointmentError?.message}
          </p>
        )}

        <div className="room-grid">
          {data?.rooms.map((room: Room) => {
            const isEditing = editingRoomId === room.id;

            return (
              <article key={room.id} className="room-card">
                <div className="room-card-header">
                  <h3>{room.name}</h3>

                  <div className="status-buttons">
                    <button
                      type="button"
                      className={`status-button available ${
                        room.status === "available" ? "active" : ""
                      }`}
                      onClick={() => handleSetRoomStatus(room, "available")}
                    >
                      available
                    </button>

                    <button
                      type="button"
                      className={`status-button occupied ${
                        room.status === "occupied" ? "active" : ""
                      }`}
                      onClick={() => handleSetRoomStatus(room, "occupied")}
                    >
                      occupied
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <form className="edit-room-form" onSubmit={handleUpdateRoom}>
                    <label>
                      Room name
                      <input
                        value={editRoomName}
                        onChange={(event) =>
                          setEditRoomName(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Location
                      <input
                        value={editRoomLocation}
                        onChange={(event) =>
                          setEditRoomLocation(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Capacity
                      <input
                        type="number"
                        value={editRoomCapacity}
                        onChange={(event) =>
                          setEditRoomCapacity(event.target.value)
                        }
                        min="1"
                        required
                      />
                    </label>

                    <label>
                      Equipment
                      <input
                        value={editRoomEquipment}
                        onChange={(event) =>
                          setEditRoomEquipment(event.target.value)
                        }
                        required
                      />
                    </label>

                    <div className="room-actions">
                      <button type="submit">Confirm</button>

                      <button type="button" onClick={cancelEditingRoom}>
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteRoom(room)}
                      >
                        Delete
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p>
                      <strong>Location:</strong> {room.location}
                    </p>

                    <p>
                      <strong>Capacity:</strong> {room.capacity}
                    </p>

                    <p>
                      <strong>Equipment:</strong> {room.equipment.join(", ")}
                    </p>

                    <div className="room-actions">
                      <button
                        type="button"
                        onClick={() => startEditingRoom(room)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteRoom(room)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}

                <div className="subsection">
                  <h4>Next appointment</h4>
                  {room.nextAppointment ? (
                    <p>
                      {room.nextAppointment.title}
                      <br />
                      {formatDateTime(room.nextAppointment.startTime)} –{" "}
                      {formatDateTime(room.nextAppointment.endTime)}
                    </p>
                  ) : (
                    <p>No upcoming appointment</p>
                  )}
                </div>

                <div className="subsection">
                  <h4>All appointments</h4>

                  {room.appointments.length === 0 ? (
                    <p>No appointments</p>
                  ) : (
                    <ul className="appointment-list">
                      {room.appointments.map((appointment: Appointment) => {
                        const isEditingAppointment =
                          editingAppointmentId === appointment.id;

                        return (
                          <li
                            key={appointment.id}
                            className="appointment-item"
                          >
                            {isEditingAppointment ? (
                              <form
                                className="edit-appointment-form"
                                onSubmit={handleUpdateAppointment}
                              >
                                <label>
                                  Title
                                  <input
                                    value={editAppointmentTitle}
                                    onChange={(event) =>
                                      setEditAppointmentTitle(
                                        event.target.value
                                      )
                                    }
                                    required
                                  />
                                </label>

                                <label>
                                  Description
                                  <input
                                    value={editAppointmentDescription}
                                    onChange={(event) =>
                                      setEditAppointmentDescription(
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>

                                <label>
                                  Room
                                  <select
                                    value={editAppointmentRoomId}
                                    onChange={(event) =>
                                      setEditAppointmentRoomId(
                                        event.target.value
                                      )
                                    }
                                    required
                                  >
                                    {data?.rooms.map((roomOption: Room) => (
                                      <option
                                        key={roomOption.id}
                                        value={roomOption.id}
                                      >
                                        {roomOption.name} —{" "}
                                        {roomOption.location}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label>
                                  Start time
                                  <input
                                    type="datetime-local"
                                    value={editAppointmentStartTime}
                                    onChange={(event) =>
                                      setEditAppointmentStartTime(
                                        event.target.value
                                      )
                                    }
                                    required
                                  />
                                </label>

                                <label>
                                  End time
                                  <input
                                    type="datetime-local"
                                    value={editAppointmentEndTime}
                                    onChange={(event) =>
                                      setEditAppointmentEndTime(
                                        event.target.value
                                      )
                                    }
                                    required
                                  />
                                </label>

                                <label>
                                  Participants
                                  <input
                                    value={editAppointmentParticipants}
                                    onChange={(event) =>
                                      setEditAppointmentParticipants(
                                        event.target.value
                                      )
                                    }
                                    required
                                  />
                                </label>

                                <div className="appointment-actions">
                                  <button type="submit">Confirm</button>

                                  <button
                                    type="button"
                                    onClick={cancelEditingAppointment}
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() =>
                                      handleDeleteAppointment(appointment)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div>
                                  <strong>{appointment.title}</strong>
                                  <br />
                                  {formatDateTime(appointment.startTime)} –{" "}
                                  {formatDateTime(appointment.endTime)}
                                </div>

                                <div className="appointment-actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditingAppointment(appointment)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() =>
                                      handleDeleteAppointment(appointment)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section section-card">
        <h2>Realtime Events</h2>

        {events.length === 0 ? (
          <p>No realtime events received yet.</p>
        ) : (
          <ul className="event-list">
            {events.map((event, index) => (
              <li key={`${event.createdAt}-${index}`}>
                <strong>{event.type}</strong> — {formatDateTime(event.createdAt)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;