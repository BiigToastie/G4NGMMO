import express, { Request, Response, NextFunction } from 'express';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cors from 'cors';
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Error Handler
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten!' });
};

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// Hauptanwendung
class Game {
    private players: Map<string, Player> = new Map();
    private items: Map<string, Item> = new Map();
    private zones: Map<string, Zone> = new Map();
    private activeChats: Set<number> = new Set();
    private userCooldowns: Map<number, number> = new Map();
    private welcomedUsers: Set<number> = new Set(); // Speichert User, die bereits begrüßt wurden

    constructor() {
        this.initializeGame();
        this.setupBotHandlers();
    }

    private initializeGame() {
        console.log('Game initialized');
    }

    private async setupBotHandlers() {
        try {
            // Entferne alle Standard-Kommandos
            await bot.setMyCommands([]);

            // Behandle neue Chat-Nachrichten
            bot.on('message', async (msg: Message) => {
                try {
                    const chatId = msg.chat.id;
                    const userId = msg.from?.id;
                    const username = msg.from?.username || msg.from?.first_name || 'Unbekannt';
                    
                    // Füge Chat zur Liste aktiver Chats hinzu
                    this.activeChats.add(chatId);

                    // Sende Willkommensnachricht, wenn der User zum ersten Mal schreibt
                    if (userId && !this.welcomedUsers.has(userId)) {
                        await bot.sendMessage(chatId, 'Willkommen bei G4NGMMO ⚔️');
                        this.welcomedUsers.add(userId);
                    }

                    // Ignoriere Kommandos
                    if (msg.text?.startsWith('/')) {
                        // Lösche Kommando-Nachricht sofort
                        try {
                            await bot.deleteMessage(chatId, msg.message_id);
                        } catch (error) {
                            console.error('Fehler beim Löschen des Kommandos:', error);
                        }
                        return;
                    }

                    // Wenn es eine Textnachricht ist
                    if (msg.text && userId) {
                        const lastMessageTime = this.userCooldowns.get(userId) || 0;
                        const currentTime = Date.now();
                        const timeSinceLastMessage = currentTime - lastMessageTime;

                        if (timeSinceLastMessage >= 30000) {
                            this.userCooldowns.set(userId, currentTime);
                            const messageText = `👤 ${username}:\n${msg.text}`;
                            
                            // Lösche die Original-Nachricht sofort
                            try {
                                await bot.deleteMessage(chatId, msg.message_id);
                            } catch (error) {
                                console.error('Fehler beim Löschen der Original-Nachricht:', error);
                            }

                            // Sende die formatierte Nachricht an alle Chats
                            for (const activeChatId of this.activeChats) {
                                try {
                                    await bot.sendMessage(activeChatId, messageText);
                                } catch (error) {
                                    if ((error as any).code === 403) {
                                        this.activeChats.delete(activeChatId);
                                    }
                                }
                            }
                        } else {
                            const remainingTime = Math.ceil((30000 - timeSinceLastMessage) / 1000);
                            const cooldownMsg = await bot.sendMessage(chatId, 
                                `⏳ Bitte warte noch ${remainingTime} Sekunden, bevor du eine weitere Nachricht sendest.`,
                                { reply_to_message_id: msg.message_id }
                            );

                            // Lösche Cooldown-Nachricht und Original-Nachricht nach 5 Sekunden
                            setTimeout(async () => {
                                try {
                                    await bot.deleteMessage(chatId, cooldownMsg.message_id);
                                    await bot.deleteMessage(chatId, msg.message_id);
                                } catch (error) {
                                    console.error('Fehler beim Löschen der Cooldown-Nachricht:', error);
                                }
                            }, 5000);
                        }
                    } else if (!msg.text) {
                        // Wenn es keine Textnachricht ist
                        const errorMsg = await bot.sendMessage(chatId, 
                            '❌ Nur Textnachrichten sind im globalen Chat erlaubt.',
                            { reply_to_message_id: msg.message_id }
                        );

                        // Lösche Fehlermeldung und Original-Nachricht nach 5 Sekunden
                        setTimeout(async () => {
                            try {
                                await bot.deleteMessage(chatId, errorMsg.message_id);
                                await bot.deleteMessage(chatId, msg.message_id);
                            } catch (error) {
                                console.error('Fehler beim Löschen der Fehlermeldung:', error);
                            }
                        }, 5000);
                    }
                } catch (error) {
                    console.error('Fehler beim Verarbeiten der Nachricht:', error);
                }
            });

            // Behandle Web App Daten
            bot.on('web_app_data', async (msg: any) => {
                try {
                    const { data } = msg.web_app_data;
                    const parsedData = JSON.parse(data);
                    console.log('Web App Data received:', parsedData);
                    
                    const confirmMsg = await bot.sendMessage(msg.chat.id, 'Spieldaten empfangen!');
                    
                    // Lösche Bestätigungsnachricht nach 3 Sekunden
                    setTimeout(async () => {
                        try {
                            await bot.deleteMessage(msg.chat.id, confirmMsg.message_id);
                        } catch (error) {
                            console.error('Fehler beim Löschen der Bestätigungsnachricht:', error);
                        }
                    }, 3000);
                } catch (error) {
                    console.error('Fehler beim Verarbeiten der Web App Daten:', error);
                }
            });
        } catch (error) {
            console.error('Fehler beim Setup der Bot-Handler:', error);
        }
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
    try {
        res.send(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>G4NG MMO</title>
                <script src="https://telegram.org/js/telegram-web-app.js"></script>
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
                    try {
                        // Telegram WebApp initialisieren
                        const webapp = window.Telegram.WebApp;
                        webapp.expand();
                        
                        // Game-Initialisierung
                        window.onload = () => {
                            const canvas = document.getElementById('game-canvas');
                            const chatId = webapp.initDataUnsafe?.user?.id;
                            
                            // Spiel-Logik hier
                            console.log('Game initialized for chat:', chatId);
                            
                            // Event an Telegram senden
                            webapp.sendData(JSON.stringify({
                                event: 'game_started',
                                chatId: chatId,
                                timestamp: new Date().toISOString()
                            }));
                        };
                    } catch (error) {
                        console.error('Fehler beim Initialisieren:', error);
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Fehler beim Rendern der Game-Seite:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// Error Handler hinzufügen
app.use(errorHandler);

// Starte Server
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
}).on('error', (error) => {
    console.error('Server-Fehler:', error);
});

export default Game; 