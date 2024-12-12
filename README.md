# MMO Telegram Game

Ein 3D-MMO-Spiel, das in Telegram Web Apps läuft.

## Features

- 3D-Charaktererstellung mit verschiedenen Klassen und Geschlechtern
- Persistente Spielwelt mit MongoDB-Speicherung
- Nahtlose Integration in Telegram
- Echtzeit-Multiplayer-Funktionalität

## Installation

1. Repository klonen:
\`\`\`bash
git clone [repository-url]
cd mmo-telegram-game
\`\`\`

2. Abhängigkeiten installieren:
\`\`\`bash
npm install
\`\`\`

3. Umgebungsvariablen konfigurieren:
- Kopiere `.env.example` zu `.env`
- Füge deine Konfigurationswerte ein:
  - TELEGRAM_BOT_TOKEN
  - MONGODB_URI
  - Andere erforderliche Variablen

4. Entwicklungsserver starten:
\`\`\`bash
npm run dev
\`\`\`

5. Für Produktion bauen:
\`\`\`bash
npm run build
\`\`\`

## Technologie-Stack

- TypeScript
- Three.js für 3D-Rendering
- Express.js Backend
- MongoDB Datenbank
- Telegram Bot API
- Webpack für Bundling

## Projektstruktur

\`\`\`
src/
├── client/           # Frontend-Code
│   ├── character/    # Charaktersystem
│   ├── game/        # Hauptspiel-Logic
│   └── assets/      # Statische Assets
├── server/          # Backend-Code
│   ├── routes/      # API-Routen
│   └── models/      # Datenmodelle
└── types/           # TypeScript Definitionen
\`\`\`

## Entwicklung

- \`npm run dev\` - Startet den Entwicklungsserver
- \`npm run build\` - Baut das Projekt für Produktion
- \`npm start\` - Startet den Produktionsserver

## Lizenz

[Ihre Lizenz hier] 