# Start- und Deployment-Anleitung

## Überblick

Diese Anleitung beschreibt, wie die Campus Interaction Platform lokal gestartet und getestet werden kann.

Die Anwendung besteht aus folgenden Teilen:

* React Frontend
* Node.js/Express Backend
* PostgreSQL Datenbank
* RabbitMQ Message Broker
* GraphQL API
* WebSocket-Endpunkt
* Notification Consumer

Die lokale Infrastruktur wird über Docker Compose gestartet. Backend und Frontend werden während der Entwicklung lokal über npm ausgeführt.

---

## Voraussetzungen

Für die Ausführung des Projekts werden folgende Werkzeuge benötigt:

* Node.js
* npm
* Docker Desktop
* Git

---

## Projekt installieren

Nach dem Klonen des Repositories müssen die Abhängigkeiten installiert werden:

```bash
npm install
```

---

## Umgebungsvariablen konfigurieren

Im Backend wird eine `.env`-Datei benötigt.

Datei:

```txt
apps/backend/.env
```

---

## Infrastruktur starten

PostgreSQL und RabbitMQ werden über Docker Compose gestartet:

```bash
docker compose up -d
```

Laufende Container können mit folgendem Befehl geprüft werden:

```bash
docker compose ps
```

---

## Backend starten

Das Backend wird aus dem Root-Verzeichnis gestartet:

```bash
npm run dev:backend
```

Bei erfolgreichem Start erscheinen unter anderem folgende Meldungen:

```txt
Database connection established.
Database schema initialized.
RabbitMQ connection established.
Notification consumer started.
GraphQL endpoint initialized at /graphql.
WebSocket endpoint initialized at /ws.
Backend server is running on http://localhost:3000
```

Wichtige Backend-Endpunkte:

| Endpunkt                          | Beschreibung               |
| --------------------------------- | -------------------------- |
| `http://localhost:3000/health`    | Health Check des Backends  |
| `http://localhost:3000/db-health` | Health Check der Datenbank |
| `http://localhost:3000/graphql`   | GraphQL-Endpunkt           |
| `ws://localhost:3000/ws`          | WebSocket-Endpunkt         |

---

## Frontend starten

Das Frontend wird in einem zweiten Terminal gestartet:

```bash
npm run dev:frontend
```

Danach ist das Frontend unter folgender Adresse erreichbar:

```txt
http://localhost:5173
```

Das Frontend zeigt Räume und Termine an, verwendet GraphQL für aggregierte Daten und empfängt WebSocket-Ereignisse für Live-Updates.

---

## RabbitMQ Management UI

RabbitMQ stellt eine Management UI bereit:

```txt
http://localhost:15672
```

Zugangsdaten:

```txt
Benutzer: guest
Passwort: guest
```

In der UI können der Exchange `appointment.events` und die Queue `notification-service.appointments` geprüft werden.

---

## Tests ausführen

Vor dem Ausführen der Tests muss die Infrastruktur laufen:

```bash
docker compose up -d
```

Danach können die Backend-Tests ausgeführt werden:

```bash
npm run test:backend
```

Die Tests prüfen unter anderem:

* Health Checks
* REST-Endpunkte
* Validierung und Fehlerbehandlung
* Zeitkonflikte bei Terminen
* GraphQL-Abfragen und Mutationen
* WebSocket-Ereignisse

---

## Projekt bauen

Das Backend kann mit folgendem Befehl gebaut werden:

```bash
npm run build:backend
```

Das Frontend kann mit folgendem Befehl gebaut werden:

```bash
npm run build:frontend
```

---

## Infrastruktur stoppen

Die Container können mit folgendem Befehl gestoppt werden:

```bash
docker compose down
```

Die Daten bleiben durch Docker Volumes erhalten. Wenn die Daten vollständig gelöscht werden sollen, können zusätzlich die Volumes entfernt werden:

```bash
docker compose down -v
```

---

## Demo-Ablauf

Für eine kurze Demonstration kann folgender Ablauf verwendet werden:

1. Docker Compose starten
2. Backend starten
3. Frontend starten
4. Einen neuen Raum im Frontend erstellen
5. Einen Termin für diesen Raum erstellen
6. Live-Event im Frontend beobachten
7. RabbitMQ-Event im Backend-Terminal prüfen
8. GraphQL-Endpunkt öffnen und aggregierte Daten abfragen
9. Tests mit `npm run test:backend` ausführen

Dieser Ablauf zeigt die wichtigsten technischen Bestandteile des Projekts: REST, GraphQL, WebSocket, PostgreSQL, RabbitMQ, Frontend und Integrationstests.
