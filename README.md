# MMO Telegram Game

Ein komplexes 3D-MMO-Spiel, das vollständig über einen Telegram Bot läuft.

## Features

- Charaktererstellung und -anpassung
- Gilden-System
- Quest-System
- Kampf-System
- Wirtschafts-System
- Vollständige Telegram-Integration

## Voraussetzungen

- Node.js >= 16.0.0
- MongoDB
- Telegram Bot Token (von @BotFather)

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
\`\`\`bash
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Werten
\`\`\`

4. Entwicklungsserver starten:
\`\`\`bash
npm run dev
\`\`\`

## Deployment

### Render Deployment

1. Erstellen Sie ein neues Web Service auf render.com
2. Verbinden Sie Ihr GitHub Repository
3. Konfigurieren Sie die Umgebungsvariablen
4. Build Command: \`npm install && npm run build\`
5. Start Command: \`npm start\`

## Entwicklung

- \`npm run dev\`: Startet den Entwicklungsserver
- \`npm run build\`: Erstellt die Production-Build
- \`npm start\`: Startet den Production-Server
- \`npm test\`: Führt Tests aus

## Projektstruktur

\`\`\`
src/
├── index.ts           # Haupteinstiegspunkt
├── systems/          # Spielsysteme
│   ├── combat.ts     # Kampfsystem
│   ├── economy.ts    # Wirtschaftssystem
│   ├── guild.ts      # Gildensystem
│   └── quests.ts     # Questsystem
└── telegram/         # Telegram-Integration
    └── integration.ts
\`\`\`

## Lizenz

MIT 