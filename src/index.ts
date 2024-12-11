import express, { Request, Response } from 'express';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import {
    BiomeType,
    ResourceType,
    Rarity,
    NPCType,
    ItemType,
    EffectType,
    CharacterClass,
    Player,
    Item,
    Zone,
    Resource,
    NPC,
    Effect
} from './types';

// Lade Umgebungsvariablen
dotenv.config();

// Express Server
const app = express();
const port = process.env.PORT || 3000;

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// Hauptanwendung
class Game {
    private players: Map<string, Player> = new Map();
    private items: Map<string, Item> = new Map();
    private zones: Map<string, Zone> = new Map();

    constructor() {
        this.initializeGame();
        this.setupBotHandlers();
    }

    private initializeGame() {
        console.log('Game initialized');
    }

    private setupBotHandlers() {
        // Behandle neue Chat-Nachrichten
        bot.on('message', (msg: Message) => {
            const chatId = msg.chat.id;
            
            // Sende Willkommensnachricht mit Spielen-Button
            const gameUrl = `https://g4ngmmo.onrender.com/game?chatId=${chatId}`;
            bot.sendMessage(chatId, 'Willkommen bei G4NG MMO!', {
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🎮 Spielen',
                            url: gameUrl,
                            web_app: {
                                url: gameUrl
                            }
                        }
                    ]]
                }
            });
        });
    }

    public addPlayer(player: Player) {
        this.players.set(player.id, player);
    }

    public getPlayer(id: string): Player | undefined {
        return this.players.get(id);
    }
}

// Erstelle Game-Instanz
const game = new Game();

// Express Routen
app.get('/', (req: Request, res: Response) => {
    res.send('MMO Game Server läuft!');
});

// Game-Route für den Vollbildmodus
app.get('/game', (req: Request, res: Response) => {
    const chatId = req.query.chatId;
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>G4NG MMO</title>
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: #000;
                }
                #game-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                #game-canvas {
                    width: 100%;
                    height: 100%;
                    background: #1a1a1a;
                }
                #ui-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    pointer-events: none;
                }
                .ui-element {
                    pointer-events: auto;
                }
            </style>
        </head>
        <body>
            <div id="game-container">
                <canvas id="game-canvas"></canvas>
                <div id="ui-overlay">
                    <!-- UI-Elemente werden hier dynamisch eingefügt -->
                </div>
            </div>
            <script>
                // Game-Initialisierung
                window.onload = () => {
                    const canvas = document.getElementById('game-canvas');
                    const chatId = '${chatId}';
                    
                    // Hier kommt später die Spiel-Logik hin
                    console.log('Game initialized for chat:', chatId);
                };
            </script>
        </body>
        </html>
    `);
});

// Starte Server
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});

export default Game; 