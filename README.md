# Lehrerpult

Windows-Anwendung für den Schulalltag: Tagesübersicht, Klassen, Stundenplan, mündliche Noten, Leistungsnachweise, Sitzplan, Unterrichtswerkzeuge und Notizen.

Alle Daten liegen ausschließlich verschlüsselt auf dem eigenen Gerät. Dieses Repository enthält nur das Programm.

## Installieren und aktualisieren

Den aktuellen Installer gibt es unter [Releases](https://github.com/till-exe/lehrerpult/releases). In der App: Einstellungen → Updates → „Nach Updates suchen“.

## Entwickeln

    npm install
    npm run dev        # Oberfläche im Browser
    npm run dist:win   # Installer bauen

Eine neue Version entsteht, indem die Versionsnummer in `package.json` erhöht und eine Marke `vX.Y.Z` hochgeladen wird.
