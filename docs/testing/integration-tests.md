# Testdokumentation

## Überblick

Für das Backend werden Integrationstests mit Jest und Supertest verwendet. Die Tests laufen gegen die echte Express-Anwendung und verwenden PostgreSQL als Datenbank.

Die benötigte Infrastruktur wird lokal über Docker Compose gestartet. Dadurch können PostgreSQL und RabbitMQ reproduzierbar bereitgestellt werden.

## Test-Setup

Vor dem Ausführen der Tests muss die Infrastruktur gestartet werden:

```bash
docker compose up -d
```

Die Tests werden anschließend mit folgendem Befehl ausgeführt:

```bash
npm run test:backend
```

Das Backend-Test-Setup initialisiert das Datenbankschema und leert vor den Tests die relevanten Tabellen. Dadurch sind die Tests unabhängig von manuell angelegten Daten.

## Verwendete Werkzeuge

| Werkzeug       | Zweck                                                  |
| -------------- | ------------------------------------------------------ |
| Jest           | Test Runner                                            |
| Supertest      | Testen von HTTP-Endpunkten                             |
| PostgreSQL     | Persistente Datenhaltung während der Integrationstests |
| Docker Compose | Bereitstellung abhängiger Systeme                      |
| ws             | Testen von WebSocket-Verbindungen                      |

## Getestete Bereiche

### Health Tests

Die Health Tests prüfen, ob das Backend und die Datenbank erreichbar sind.

Getestete Endpunkte:

* `GET /health`
* `GET /db-health`

Dadurch wird sichergestellt, dass die Anwendung grundsätzlich gestartet werden kann und eine Verbindung zur Datenbank besteht.

---

### REST-Integrationstests

Die REST-Integrationstests prüfen zentrale Use Cases der Raum- und Terminverwaltung.

Getestete Szenarien:

* Erstellen und Abrufen eines Raums
* Validierung ungültiger Raumdaten
* Erstellen eines Termins für einen bestehenden Raum
* Erkennung von Zeitkonflikten bei Raumbelegungen
* Aktualisieren und Löschen eines Termins

Diese Tests prüfen das Zusammenspiel folgender Komponenten:

```txt
REST Route → Service Layer → Repository Layer → PostgreSQL
```

Besonders wichtig ist der Test für Zeitkonflikte. Dabei wird geprüft, dass ein Raum nicht für zwei sich überschneidende Termine gleichzeitig gebucht werden kann.

---

### GraphQL-Integrationstests

Die GraphQL-Integrationstests prüfen den GraphQL-Endpunkt `/graphql`.

Getestete Szenarien:

* Erstellen eines Raums über eine GraphQL-Mutation
* Abrufen von Räumen über eine GraphQL-Query
* Erstellen eines Termins über eine GraphQL-Mutation
* Abrufen von Räumen inklusive ihrer Termine
* Abfrage freier Räume in einem bestimmten Zeitfenster

Die Tests zeigen, dass GraphQL als aggregierende API-Schicht funktioniert und dieselbe Service- und Repository-Schicht verwendet wie die REST-Endpunkte.

Für die Abfrage freier Räume wird geprüft, dass Räume mit bestehenden Zeitkonflikten nicht als frei zurückgegeben werden.

---

### WebSocket-Integrationstests

Die WebSocket-Integrationstests prüfen, ob Echtzeitereignisse korrekt an verbundene Clients gesendet werden.

Getestete Szenarien:

* Aufbau einer WebSocket-Verbindung
* Empfang eines `ROOM_CREATED`-Ereignisses nach dem Erstellen eines Raums
* Empfang eines `APPOINTMENT_CREATED`-Ereignisses nach dem Erstellen eines Termins

Für diese Tests wird ein echter HTTP-Server gestartet. Der WebSocket-Server wird an denselben HTTP-Server gebunden. Dadurch wird das Zusammenspiel von REST-Endpunkten, Service-Schicht und WebSocket-Broadcast getestet.

---

### End-to-End-Integrationstest

Zusätzlich gibt es einen End-to-End-Integrationstest, der einen vollständigen fachlichen Ablauf prüft.

Getesteter Ablauf:

```txt
Raum über REST erstellen
→ Termin über REST erstellen
→ WebSocket empfängt APPOINTMENT_CREATED
→ GraphQL liefert den Termin beim Raum zurück
→ GraphQL freeRoomsInTimeRange gibt den belegten Raum nicht als frei zurück
```

---

## Umgang mit RabbitMQ in Tests

RabbitMQ wird im Projekt für asynchrone Terminereignisse verwendet. In den REST- und GraphQL-Integrationstests steht jedoch die Prüfung der HTTP- und GraphQL-Schnittstellen im Vordergrund.

Damit die REST- und GraphQL-Tests nicht von einer aktiven RabbitMQ-Verbindung abhängig sind, verhindert die Publisher-Logik, dass ein nicht initialisierter RabbitMQ-Channel die eigentliche API-Funktionalität fehlschlagen lässt.

Die RabbitMQ-Integration wurde zusätzlich manuell über die laufende Anwendung geprüft:

* Termin erstellen
* RabbitMQ-Event wird publiziert
* Notification Consumer empfängt das Event
* Exchange und Queue sind in der RabbitMQ Management UI sichtbar

## Bewertung des Testansatzes

Der gewählte Testansatz ist bewusst pragmatisch. Die wichtigsten Integrationspunkte der Anwendung werden automatisiert geprüft:

* REST-Endpunkte
* GraphQL-Endpunkt
* Datenbankintegration
* Validierung und Fehlerbehandlung
* Zeitkonfliktprüfung
* WebSocket-Ereignisse

Für den Rahmen des Semesterprojekts decken diese Tests die zentralen technischen Anforderungen ab und bleiben gleichzeitig verständlich und wartbar.
