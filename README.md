# Campus Interaction Platform

Semesterprojekt im Modul Advanced Web Technologies.

Ziel ist die prototypische Entwicklung einer Campus Interaction Platform. Die Anwendung ermöglicht die Verwaltung von Räumen und Terminen sowie Echtzeit-Benachrichtigungen bei Änderungen.

## Geplante Technologien

* React mit TypeScript für das Frontend
* Node.js, Express und TypeScript für das Backend
* REST für Raum- und Terminverwaltung
* GraphQL für aggregierte Abfragen
* WebSockets für Echtzeit-Updates
* RabbitMQ für asynchrone Ereignisse
* PostgreSQL für Persistenz
* Docker Compose für lokale Infrastruktur
* Jest und Supertest für Integrationstests

## Architekturentscheidung

Das Projekt verwendet einen modularen Monolithen in einem Monorepo. Die Entscheidung ist in `docs/adr/001-architecture-style.md` dokumentiert.

## Lokales Infrastruktur-Setup

Für die lokale Entwicklung werden PostgreSQL und RabbitMQ über Docker Compose gestartet.

### Infrastruktur starten

```bash
docker compose up -d
```

### Laufende Container anzeigen

```bash
docker compose ps
```

### PostgreSQL

Die lokale PostgreSQL-Datenbank wird mit folgenden Zugangsdaten gestartet:

* Host: `localhost`
* Port: `5432`
* Datenbank: `campus_db`
* Benutzer: `campus_user`
* Passwort: `campus_password`

### RabbitMQ

RabbitMQ wird inklusive Management UI gestartet.

* AMQP-Port: `5672`
* Management UI: `http://localhost:15672`
* Benutzer: `guest`
* Passwort: `guest`

### Infrastruktur stoppen

```bash
docker compose down
```

Die Daten bleiben durch Docker Volumes erhalten.

## REST-Endpunkte: Raumverwaltung

Die Raumverwaltung wird über REST-Endpunkte bereitgestellt. Räume können angelegt, gelesen, aktualisiert und gelöscht werden.

### Endpunkte

| Methode | Pfad         | Beschreibung                                      |
| ------- | ------------ | ------------------------------------------------- |
| GET     | `/rooms`     | Gibt alle Räume zurück                            |
| GET     | `/rooms/:id` | Gibt einen einzelnen Raum anhand seiner ID zurück |
| POST    | `/rooms`     | Erstellt einen neuen Raum                         |
| PUT     | `/rooms/:id` | Aktualisiert einen bestehenden Raum               |
| DELETE  | `/rooms/:id` | Löscht einen bestehenden Raum                     |

### Beispiel: Raum erstellen

```json
{
  "name": "D1.05",
  "location": "Hochschule Mainz, Gebäude D",
  "capacity": 30,
  "equipment": ["Beamer", "Whiteboard", "WLAN"]
}
```

### Validierung und Fehlerbehandlung

Beim Erstellen eines Raums werden Pflichtfelder und einfache Plausibilitätsregeln geprüft. Der Name und der Standort dürfen nicht leer sein. Die Kapazität muss eine positive ganze Zahl sein. Die Ausstattung wird als Liste gespeichert.

Bei ungültigen Eingaben wird der HTTP-Statuscode `400` zurückgegeben. Wenn ein Raum nicht gefunden wird, wird `404` zurückgegeben. Erfolgreiches Löschen wird mit `204 No Content` beantwortet.

Hinweis: In der ersten Implementationsstufe werden Räume noch im Arbeitsspeicher gespeichert. Die Persistenz über PostgreSQL wird in einem späteren Schritt ergänzt.

## REST-Endpunkte: Terminverwaltung

Die Terminverwaltung wird ebenfalls über REST-Endpunkte bereitgestellt. Termine können angelegt, gelesen, aktualisiert und gelöscht werden.

### Endpunkte

| Methode | Pfad                           | Beschreibung                                        |
| ------- | ------------------------------ | --------------------------------------------------- |
| GET     | `/appointments`                | Gibt alle Termine zurück                            |
| GET     | `/appointments?roomId=:roomId` | Gibt alle Termine eines bestimmten Raums zurück     |
| GET     | `/appointments/:id`            | Gibt einen einzelnen Termin anhand seiner ID zurück |
| POST    | `/appointments`                | Erstellt einen neuen Termin                         |
| PUT     | `/appointments/:id`            | Aktualisiert einen bestehenden Termin               |
| DELETE  | `/appointments/:id`            | Löscht einen bestehenden Termin                     |

### Beispiel: Termin erstellen

```json
{
  "title": "AWT Projektbesprechung",
  "description": "Besprechung zum Semesterprojekt",
  "roomId": "ROOM_ID",
  "startTime": "2026-06-10T10:00:00.000Z",
  "endTime": "2026-06-10T11:00:00.000Z",
  "participants": ["behnam@example.com"]
}
```

### Validierung und Zeitkonflikte

Beim Erstellen und Aktualisieren eines Termins wird geprüft, ob der angegebene Raum existiert. Außerdem müssen Start- und Endzeit gültige Datumswerte sein. Die Endzeit muss nach der Startzeit liegen.

Zusätzlich wird geprüft, ob der gewählte Raum im angegebenen Zeitraum bereits durch einen anderen Termin belegt ist. Zeitliche Überschneidungen werden verhindert. In diesem Fall gibt die API den HTTP-Statuscode `400` mit einer Fehlermeldung zurück.

Hinweis: In dieser Implementationsstufe werden Termine noch im Arbeitsspeicher gespeichert. Die Persistenz über PostgreSQL wird in einem späteren Schritt ergänzt.

## Datenbank-Schema

Die Anwendung verwendet PostgreSQL als relationale Datenbank. Das Schema wird beim Start des Backends automatisch initialisiert, falls die Tabellen noch nicht existieren.

### Tabelle `rooms`

Die Tabelle `rooms` speichert die Räume der Campus Interaction Platform.

| Spalte       | Typ       | Beschreibung                                  |
| ------------ | --------- | --------------------------------------------- |
| `id`         | UUID      | Eindeutige ID des Raums                       |
| `name`       | TEXT      | Name des Raums                                |
| `location`   | TEXT      | Standort des Raums                            |
| `capacity`   | INTEGER   | Kapazität des Raums                           |
| `equipment`  | TEXT[]    | Ausstattung des Raums                         |
| `status`     | TEXT      | Status des Raums: `available` oder `occupied` |
| `created_at` | TIMESTAMP | Zeitpunkt der Erstellung                      |

### Tabelle `appointments`

Die Tabelle `appointments` speichert Termine und Raumreservierungen.

| Spalte         | Typ       | Beschreibung                      |
| -------------- | --------- | --------------------------------- |
| `id`           | UUID      | Eindeutige ID des Termins         |
| `title`        | TEXT      | Titel des Termins                 |
| `description`  | TEXT      | Optionale Beschreibung            |
| `room_id`      | UUID      | Referenz auf den zugehörigen Raum |
| `start_time`   | TIMESTAMP | Startzeit des Termins             |
| `end_time`     | TIMESTAMP | Endzeit des Termins               |
| `participants` | TEXT[]    | Liste der Teilnehmenden           |
| `created_at`   | TIMESTAMP | Zeitpunkt der Erstellung          |

Die Datenbank enthält Constraints für grundlegende Datenintegrität. Die Kapazität eines Raums muss positiv sein, der Raumstatus ist auf `available` und `occupied` beschränkt und die Endzeit eines Termins muss nach der Startzeit liegen.

## Persistenz der REST-Daten

Die REST-Endpunkte für Räume und Termine verwenden PostgreSQL als persistente Datenhaltung. Dadurch bleiben angelegte Räume und Termine auch nach einem Neustart des Backends erhalten.

Die fachliche Logik ist weiterhin in Service-Dateien gekapselt. Die Repository-Dateien übernehmen den Zugriff auf die Datenbank. Dadurch bleibt die Anwendung modular aufgebaut:

```txt
Route → Service → Repository → PostgreSQL
```

Die Validierung der Eingabedaten erfolgt im Service-Layer. Die Datenbank ergänzt diese Prüfungen durch Constraints, zum Beispiel für positive Raumkapazitäten, gültige Raumstatus und gültige Terminzeiten.

## GraphQL-Gateway

Zusätzlich zu den REST-Endpunkten stellt das Backend einen GraphQL-Endpunkt unter `/graphql` bereit.

GraphQL wird in diesem Projekt nicht als Ersatz für REST verwendet, sondern für aggregierte Abfragen. Die grundlegende Verwaltung von Räumen und Terminen bleibt über REST verfügbar. GraphQL greift auf dieselbe Service-Schicht zu und kombiniert die Daten aus Raum- und Terminverwaltung.

### Beispiele für GraphQL-Abfragen

Über GraphQL können unter anderem folgende Abfragen durchgeführt werden:

* Alle Räume inklusive ihrer Termine
* Ein Raum mit dem nächsten geplanten Termin
* Alle Termine inklusive zugehörigem Raum
* Freie Räume in einem bestimmten Zeitfenster

### Beispiel

```graphql
query {
  rooms {
    id
    name
    status
    appointments {
      title
      startTime
      endTime
    }
    nextAppointment {
      title
      startTime
    }
  }
}
```

Die Resolver verwenden die bestehende Service-Schicht der Anwendung. Dadurch wird fachliche Logik nicht doppelt implementiert, sondern zentral wiederverwendet.

## Echtzeit-Aktualisierungen mit WebSocket

Das Backend stellt zusätzlich zu REST und GraphQL einen WebSocket-Endpunkt unter `/ws` bereit.

Über diesen Kanal werden Änderungen an Räumen und Terminen in Echtzeit an verbundene Clients gesendet. Dadurch kann das Frontend später ein Live-Dashboard aktualisieren, ohne regelmäßig neue HTTP-Anfragen senden zu müssen.

### WebSocket-Endpunkt

```txt
ws://localhost:3000/ws
```

### Gesendete Ereignisse

| Ereignis              | Beschreibung                              |
| --------------------- | ----------------------------------------- |
| `ROOM_CREATED`        | Ein neuer Raum wurde erstellt             |
| `ROOM_UPDATED`        | Ein bestehender Raum wurde aktualisiert   |
| `ROOM_DELETED`        | Ein Raum wurde gelöscht                   |
| `APPOINTMENT_CREATED` | Ein neuer Termin wurde erstellt           |
| `APPOINTMENT_UPDATED` | Ein bestehender Termin wurde aktualisiert |
| `APPOINTMENT_DELETED` | Ein Termin wurde gelöscht                 |

### Beispielnachricht

```json
{
  "type": "APPOINTMENT_CREATED",
  "payload": {
    "id": "example-id",
    "title": "AWT Projektbesprechung",
    "roomId": "room-id",
    "startTime": "2026-06-10T10:00:00.000Z",
    "endTime": "2026-06-10T11:00:00.000Z",
    "participants": ["test@example.com"]
  },
  "createdAt": "2026-06-09T12:00:00.000Z"
}
```

Die WebSocket-Kommunikation ist bewusst als einfache Broadcast-Lösung umgesetzt. Für das Semesterprojekt reicht dies aus, um Echtzeit-Updates nachvollziehbar zu demonstrieren.

## Asynchrone Ereignisse mit RabbitMQ

Für asynchrone Kommunikation verwendet das Backend RabbitMQ. Wenn ein Termin erstellt, aktualisiert oder gelöscht wird, veröffentlicht die Anwendung ein Ereignis über RabbitMQ.

Die Ereignisse werden über den Exchange `appointment.events` publiziert. Der Notification-Consumer ist an diesen Exchange gebunden und verarbeitet alle Routing Keys nach dem Muster `appointment.*`.

### Veröffentlichte Ereignisse

| Ereignis              | Routing Key           | Beschreibung                              |
| --------------------- | --------------------- | ----------------------------------------- |
| `APPOINTMENT_CREATED` | `appointment.created` | Ein neuer Termin wurde erstellt           |
| `APPOINTMENT_UPDATED` | `appointment.updated` | Ein bestehender Termin wurde aktualisiert |
| `APPOINTMENT_DELETED` | `appointment.deleted` | Ein Termin wurde gelöscht                 |

### Notification Consumer

Der Notification Consumer konsumiert die Terminereignisse asynchron. In der aktuellen Implementierung erzeugt der Consumer eine Konsolenausgabe, die eine spätere In-App-Benachrichtigung simuliert.

Dadurch ist die Terminverwaltung nicht direkt an die Benachrichtigungslogik gekoppelt. Die Kommunikation erfolgt ereignisbasiert über RabbitMQ.

### RabbitMQ Management UI

RabbitMQ kann lokal über die Management UI eingesehen werden:

```txt
http://localhost:15672
```

Standard-Zugangsdaten:

```txt
Benutzer: guest
Passwort: guest
```

## Frontend-Dashboard

Das Frontend ist als React Single Page Application mit TypeScript umgesetzt. Es zeigt eine Übersicht der Räume und Termine an und verwendet GraphQL zur Abfrage aggregierter Daten.

Das Dashboard ruft Räume inklusive ihrer Termine und des nächsten geplanten Termins über den GraphQL-Endpunkt `/graphql` ab. Zusätzlich verbindet sich das Frontend mit dem WebSocket-Endpunkt `/ws`, um Änderungen an Räumen und Terminen in Echtzeit zu empfangen.

Bei eingehenden WebSocket-Ereignissen wird die GraphQL-Abfrage automatisch erneut ausgeführt. Dadurch bleibt die Anzeige ohne manuelles Neuladen aktuell.

### Verwendete Schnittstellen

| Schnittstelle      | Zweck                                                   |
| ------------------ | ------------------------------------------------------- |
| GraphQL `/graphql` | Abfrage von Räumen, Terminen und aggregierten Daten     |
| WebSocket `/ws`    | Empfang von Echtzeit-Ereignissen bei Änderungen         |
| REST               | Wird weiterhin für CRUD-Operationen und Tests verwendet |

In der aktuellen Ausbaustufe zeigt das Frontend die Daten an und reagiert auf Echtzeitereignisse. Formulare zum Erstellen von Räumen und Terminen werden in einem weiteren Schritt ergänzt.

## Frontend-Formulare

Das Frontend enthält einfache Formulare zum Erstellen von Räumen und Terminen. Die Formulare verwenden GraphQL-Mutationen und greifen damit auf dieselbe fachliche Service-Schicht wie die REST-Endpunkte zu.

### Raum erstellen

Über das Formular „Create Room“ können neue Räume mit Name, Standort, Kapazität und Ausstattung erstellt werden.

### Termin erstellen

Über das Formular „Create Appointment“ können Termine für bestehende Räume angelegt werden. Dabei werden die Validierungsregeln des Backends verwendet. Zeitkonflikte werden serverseitig erkannt und als Fehler an das Frontend zurückgegeben.

Nach erfolgreichen Änderungen aktualisiert sich das Das

## Integrationstests

Für Integrationstests verwendet das Backend Jest und Supertest. Die Tests prüfen die HTTP-Schnittstellen gegen die echte Express-Anwendung.

Die abhängigen Systeme, insbesondere PostgreSQL und RabbitMQ, werden lokal über Docker Compose bereitgestellt. Dadurch ist das Test-Setup reproduzierbar und entspricht dem lokalen Entwicklungssetup.

### Tests ausführen

Vor dem Start der Tests muss die Infrastruktur laufen:

```bash
docker compose up -d
```

### REST-Integrationstests

Die REST-Integrationstests prüfen zentrale Use Cases der Anwendung:

* Erstellen und Abrufen von Räumen
* Validierung ungültiger Raumdaten
* Erstellen von Terminen für bestehende Räume
* Erkennung von Zeitkonflikten bei Raumbelegungen
* Aktualisieren und Löschen von Terminen

Die Tests laufen gegen die echte Express-Anwendung und verwenden PostgreSQL als persistente Datenhaltung. Dadurch wird nicht nur einzelne Logik isoliert getestet, sondern das Zusammenspiel von Route, Service, Repository und Datenbank.

### WebSocket-Integrationstests

Die WebSocket-Integrationstests prüfen, ob Echtzeitereignisse korrekt an verbundene Clients gesendet werden.

Getestet werden unter anderem:

* Aufbau einer WebSocket-Verbindung
* Empfang eines `ROOM_CREATED`-Ereignisses nach dem Erstellen eines Raums
* Empfang eines `APPOINTMENT_CREATED`-Ereignisses nach dem Erstellen eines Termins

Für den Test wird ein echter HTTP-Server mit der Express-Anwendung gestartet. Der WebSocket-Server wird an denselben HTTP-Server gebunden. Dadurch wird das Zusammenspiel von REST-Endpunkt, Service-Schicht und WebSocket-Broadcast getestet.

## Architektur-Dokumentation

Die wichtigsten Architekturentscheidungen sind als Architectural Decision Records dokumentiert.

### ADRs

| Datei                                   | Inhalt                                              |
| --------------------------------------- | --------------------------------------------------- |
| `docs/adr/0001-architecture-style.md`   | Entscheidung für einen modularen Monolithen         |
| `docs/adr/0002-messaging-technology.md` | Entscheidung für RabbitMQ als Messaging-Technologie |

### Architekturdiagramm

Das Architekturdiagramm befindet sich unter:

```txt
docs/diagrams/architecture.mmd
```

Es zeigt die wichtigsten Komponenten der Anwendung: React Frontend, Express Backend, REST API, GraphQL Gateway, WebSocket-Komponente, PostgreSQL, RabbitMQ und Notification Consumer.

## Weitere Dokumentation

| Dokument | Pfad |
|---|---|
| API-Dokumentation | `docs/api/api-documentation.md` |
| Testdokumentation | `docs/testing/integration-tests.md` |
| Architekturdiagramm | `docs/diagrams/architecture.mmd` |
| Architekturentscheidungen | `docs/adr/` |
| KI-Nutzung | `docs/ai-usage/ai-usage-table.md` |
| Start- und Deployment-Anleitung | `docs/deployment/start-and-deployment.md` |
