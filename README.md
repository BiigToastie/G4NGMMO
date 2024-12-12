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
  - MONGODB_URI (erforderlich)
  - TELEGRAM_BOT_TOKEN (erforderlich)
  - Andere optionale Variablen

4. Entwicklungsserver starten:
\`\`\`bash
npm run dev
\`\`\`

5. Für Produktion bauen:
\`\`\`bash
npm run build
\`\`\`

## Deployment auf Render

1. Verbinde dein GitHub-Repository mit Render
2. Erstelle einen neuen Web Service
3. Setze die folgenden Umgebungsvariablen:
   - `MONGODB_URI` - Deine MongoDB-Verbindungs-URL
   - `TELEGRAM_BOT_TOKEN` - Dein Bot-Token von @BotFather
   - `NODE_ENV` - Setze auf "production"
   - `PORT` - Wird von Render automatisch gesetzt
   - `BASE_URL` - Deine Render-Service-URL

4. Build-Einstellungen:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

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