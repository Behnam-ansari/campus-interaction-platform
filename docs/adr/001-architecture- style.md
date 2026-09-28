# ADR 0001: Wahl der Architekturform

## Entscheidung

Für das Projekt wird ein modularer Monolith gewählt.

Die Anwendung wird in einem Monorepo organisiert. Das Backend wird als eine Anwendung umgesetzt, aber intern klar in Module getrennt. Vorgesehen sind unter anderem Module für Räume, Termine, Benachrichtigungen, GraphQL, WebSocket-Kommunikation und Messaging.

## Begründung

Ein modularer Monolith reduziert die technische Komplexität im Vergleich zu einer Microservices-Architektur. Es müssen keine mehreren unabhängig deploybaren Services betrieben, konfiguriert und überwacht werden. Dadurch bleibt das Projekt für den gegebenen Zeitrahmen besser beherrschbar.

Gleichzeitig ermöglicht die modulare Struktur eine klare fachliche Trennung der Komponenten. Die Schnittstellen zwischen den Modulen können bewusst gestaltet und dokumentiert werden. Dadurch werden wichtige Architekturprinzipien wie Modularisierung, klare Verantwortlichkeiten und Testbarkeit berücksichtigt.

Die behandelten Technologien der Vorlesung können trotzdem sinnvoll integriert werden: REST wird für die Raum- und Terminverwaltung verwendet, GraphQL für aggregierte Abfragen, WebSockets für Echtzeit-Updates und RabbitMQ für asynchrone Ereignisse.

## Konsequenzen

Die Entwicklung und das lokale Setup bleiben einfacher als bei einer Microservices-Architektur. Die Anwendung kann leichter getestet und demonstriert werden.

Ein Nachteil ist, dass die Komponenten nicht unabhängig voneinander deployt werden. Für das Semesterprojekt wird dieser Nachteil akzeptiert, da der Schwerpunkt auf einer nachvollziehbaren Architektur, funktionierender Integration und sauberer Dokumentation liegt.

Falls die Anwendung später erweitert werden sollte, könnten einzelne Module aus dem modularen Monolithen in eigenständige Services ausgelagert werden.
