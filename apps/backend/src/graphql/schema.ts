export const typeDefs = `#graphql
  type Room {
    id: ID!
    name: String!
    location: String!
    capacity: Int!
    equipment: [String!]!
    status: String!
    appointments: [Appointment!]!
    nextAppointment: Appointment
  }

  type Appointment {
    id: ID!
    title: String!
    description: String
    roomId: ID!
    startTime: String!
    endTime: String!
    participants: [String!]!
    room: Room
  }

  input CreateRoomInput {
    name: String!
    location: String!
    capacity: Int!
    equipment: [String!]!
  }

  input UpdateRoomInput {
    name: String
    location: String
    capacity: Int
    equipment: [String!]
    status: String
  }

  input CreateAppointmentInput {
    title: String!
    description: String
    roomId: ID!
    startTime: String!
    endTime: String!
    participants: [String!]!
  }

  input UpdateAppointmentInput {
    title: String
    description: String
    roomId: ID
    startTime: String
    endTime: String
    participants: [String!]
  }

  type Query {
    rooms: [Room!]!
    room(id: ID!): Room
    appointments: [Appointment!]!
    appointment(id: ID!): Appointment
    appointmentsByRoom(roomId: ID!): [Appointment!]!
    freeRoomsInTimeRange(startTime: String!, endTime: String!): [Room!]!
  }

  type Mutation {
    createRoom(input: CreateRoomInput!): Room!
    updateRoom(id: ID!, input: UpdateRoomInput!): Room
    deleteRoom(id: ID!): Boolean!

    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment
    deleteAppointment(id: ID!): Boolean!
  }
`;