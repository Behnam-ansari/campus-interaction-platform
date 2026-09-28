# API-Dokumentation

## Überblick

Die Campus Interaction Platform stellt mehrere Schnittstellen bereit:

* REST-Endpunkte für die Verwaltung von Räumen und Terminen
* GraphQL-Endpunkt für aggregierte Abfragen
* WebSocket-Endpunkt für Echtzeitereignisse

Die REST-Endpunkte werden vor allem für klassische CRUD-Operationen verwendet. GraphQL wird zusätzlich genutzt, um zusammenhängende Daten effizient abzufragen, zum Beispiel Räume inklusive ihrer Termine oder freie Räume in einem Zeitfenster.

---

## REST API

### Raumverwaltung

#### `GET /rooms`

Gibt alle Räume zurück.

**Beispielantwort:**

```json
[
  {
    "id": "room-id",
    "name": "D1.05",
    "location": "Hochschule Mainz, Gebäude D",
    "capacity": 30,
    "equipment": ["Beamer", "Whiteboard"],
    "status": "available"
  }
]
```

#### `GET /rooms/:id`

Gibt einen einzelnen Raum anhand seiner ID zurück.

Wenn kein Raum gefunden wird, wird `404 Not Found` zurückgegeben.

#### `POST /rooms`

Erstellt einen neuen Raum.

**Beispielrequest:**

```json
{
  "name": "D1.05",
  "location": "Hochschule Mainz, Gebäude D",
  "capacity": 30,
  "equipment": ["Beamer", "Whiteboard"]
}
```

**Validierung:**

* `name` darf nicht leer sein
* `location` darf nicht leer sein
* `capacity` muss eine positive ganze Zahl sein
* `equipment` muss ein Array sein

Bei ungültigen Daten wird `400 Bad Request` zurückgegeben.

#### `PUT /rooms/:id`

Aktualisiert einen bestehenden Raum.

**Beispielrequest:**

```json
{
  "status": "occupied"
}
```

Wenn der Raum nicht existiert, wird `404 Not Found` zurückgegeben.

#### `DELETE /rooms/:id`

Löscht einen Raum.

Bei erfolgreichem Löschen wird `204 No Content` zurückgegeben.

---

### Terminverwaltung

#### `GET /appointments`

Gibt alle Termine zurück.

#### `GET /appointments?roomId=:roomId`

Gibt alle Termine für einen bestimmten Raum zurück.

#### `GET /appointments/:id`

Gibt einen einzelnen Termin anhand seiner ID zurück.

Wenn kein Termin gefunden wird, wird `404 Not Found` zurückgegeben.

#### `POST /appointments`

Erstellt einen neuen Termin.

**Beispielrequest:**

```json
{
  "title": "AWT Projektbesprechung",
  "description": "Besprechung zum Semesterprojekt",
  "roomId": "room-id",
  "startTime": "2026-06-20T10:00:00.000Z",
  "endTime": "2026-06-20T11:00:00.000Z",
  "participants": ["test@example.com"]
}
```

**Validierung:**

* `title` darf nicht leer sein
* `roomId` muss vorhanden sein
* der angegebene Raum muss existieren
* `startTime` und `endTime` müssen gültige Datumswerte sein
* `endTime` muss nach `startTime` liegen
* `participants` muss ein Array sein
* der Termin darf keinen Zeitkonflikt mit einem bestehenden Termin im selben Raum erzeugen

Bei ungültigen Daten oder Zeitkonflikten wird `400 Bad Request` zurückgegeben.

#### `PUT /appointments/:id`

Aktualisiert einen bestehenden Termin.

**Beispielrequest:**

```json
{
  "title": "Aktualisierte Projektbesprechung"
}
```

Wenn der Termin nicht existiert, wird `404 Not Found` zurückgegeben.

#### `DELETE /appointments/:id`

Löscht einen Termin.

Bei erfolgreichem Löschen wird `204 No Content` zurückgegeben.

---

## GraphQL API

Der GraphQL-Endpunkt ist verfügbar unter:

```txt
/graphql
```

GraphQL wird verwendet, um aggregierte Daten abzufragen. Die Resolver greifen auf dieselbe Service- und Repository-Schicht zu wie die REST-Endpunkte.

### Räume abrufen

```graphql
query {
  rooms {
    id
    name
    location
    capacity
    equipment
    status
  }
}
```

### Räume mit Terminen abrufen

```graphql
query {
  rooms {
    id
    name
    appointments {
      id
      title
      startTime
      endTime
    }
  }
}
```

### Termine inklusive Raum abrufen

```graphql
query {
  appointments {
    id
    title
    startTime
    endTime
    room {
      id
      name
      location
    }
  }
}
```

### Freie Räume in einem Zeitfenster abrufen

```graphql
query {
  freeRoomsInTimeRange(
    startTime: "2026-06-20T10:30:00.000Z"
    endTime: "2026-06-20T11:30:00.000Z"
  ) {
    id
    name
    location
  }
}
```

Diese Abfrage gibt nur Räume zurück, die im angegebenen Zeitraum keinen überschneidenden Termin haben.

### Raum über GraphQL erstellen

```graphql
mutation {
  createRoom(
    input: {
      name: "A2.01"
      location: "Hochschule Mainz, Gebäude A"
      capacity: 40
      equipment: ["Beamer", "Tafel"]
    }
  ) {
    id
    name
    status
  }
}
```

### Termin über GraphQL erstellen

```graphql
mutation {
  createAppointment(
    input: {
      title: "GraphQL Testtermin"
      description: "Termin wurde über GraphQL erstellt"
      roomId: "room-id"
      startTime: "2026-06-21T09:00:00.000Z"
      endTime: "2026-06-21T10:00:00.000Z"
      participants: ["test@example.com"]
    }
  ) {
    id
    title
    roomId
  }
}
```

---

## WebSocket API

Der WebSocket-Endpunkt ist verfügbar unter:

```txt
ws://localhost:3000/ws
```

Über WebSocket werden Echtzeitereignisse an verbundene Clients gesendet.

### Ereignisse

| Ereignis              | Beschreibung                  |
| --------------------- | ----------------------------- |
| `ROOM_CREATED`        | Ein Raum wurde erstellt       |
| `ROOM_UPDATED`        | Ein Raum wurde aktualisiert   |
| `ROOM_DELETED`        | Ein Raum wurde gelöscht       |
| `APPOINTMENT_CREATED` | Ein Termin wurde erstellt     |
| `APPOINTMENT_UPDATED` | Ein Termin wurde aktualisiert |
| `APPOINTMENT_DELETED` | Ein Termin wurde gelöscht     |

### Beispielnachricht

```json
{
  "type": "APPOINTMENT_CREATED",
  "payload": {
    "id": "appointment-id",
    "title": "AWT Projektbesprechung",
    "roomId": "room-id",
    "startTime": "2026-06-20T10:00:00.000Z",
    "endTime": "2026-06-20T11:00:00.000Z",
    "participants": ["test@example.com"]
  },
  "createdAt": "2026-06-19T12:00:00.000Z"
}
```
