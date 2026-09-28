# ADR 0002: Wahl der Messaging-Technologie

## Status

Akzeptiert

## Kontext

Die Campus Interaction Platform verarbeitet fachliche Ereignisse, zum Beispiel wenn ein Termin erstellt, aktualisiert oder gelöscht wird. Diese Ereignisse sollen nicht nur direkt in der Terminverwaltung verarbeitet werden, sondern auch von einer Benachrichtigungskomponente genutzt werden können.

Dafür wurde eine Messaging-Lösung benötigt. Im Rahmen des Projekts kamen grundsätzlich RabbitMQ und Kafka in Frage. Beide Technologien wurden im Kontext asynchroner Kommunikation betrachtet.

## Entscheidung

Für das Projekt wird RabbitMQ als Messaging-Technologie verwendet.

Terminereignisse werden über den Exchange `appointment.events` veröffentlicht. Der Notification Consumer konsumiert diese Ereignisse über eine Queue und simuliert daraus In-App-Benachrichtigungen.

## Begründung

RabbitMQ eignet sich gut für klassische nachrichtenbasierte Kommunikation zwischen Anwendungskomponenten. Die Anforderungen des Projekts bestehen vor allem darin, einzelne Ereignisse zuverlässig an einen Consumer weiterzugeben.

Kafka wäre besonders geeignet für Event Streaming, hohe Datenmengen, langfristige Event-Historien und mehrere unabhängige Konsumenten mit Replay-Funktionalität. Diese Eigenschaften sind für den Prototyp der Campus Interaction Platform nicht zwingend erforderlich.

RabbitMQ ist für dieses Projekt einfacher einzurichten, leichter zu erklären und ausreichend für den geplanten Anwendungsfall. Dadurch bleibt die Architektur nachvollziehbar und realistisch umsetzbar.

## Konsequenzen

Die Anwendung kann Terminereignisse asynchron verarbeiten. Die Terminverwaltung ist dadurch nicht direkt an die Benachrichtigungslogik gekoppelt.

Ein Nachteil ist, dass die Lösung nicht auf langfristiges Event Streaming ausgelegt ist. Für das Semesterprojekt wird dieser Nachteil akzeptiert, da der Schwerpunkt auf einer nachvollziehbaren Integration von Messaging liegt.

Falls die Plattform später stärker eventgetrieben erweitert werden sollte, könnte Kafka als Alternative erneut geprüft werden.
