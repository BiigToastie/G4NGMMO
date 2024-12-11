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
    private systemMessages: Map<number, { messageId: number, deleteAt: number }[]> = new Map();

    constructor() {
        this.initializeGame();
        this.setupBotHandlers();
        this.startCleanupInterval();
    }

    private initializeGame() {
        console.log('Game initialized');
    }

    private startCleanupInterval() {
        // Alle 5 Sekunden aufräumen
        setInterval(() => {
            const now = Date.now();
            for (const [chatId, messages] of this.systemMessages.entries()) {
                const expiredMessages = messages.filter(msg => msg.deleteAt <= now);
                expiredMessages.forEach(async (msg) => {
                    try {
                        await bot.deleteMessage(chatId, msg.messageId);
                    } catch (error) {
                        console.error('Fehler beim Löschen der Nachricht:', error);
                    }
                });
                // Aktualisiere die Liste der System-Nachrichten
                this.systemMessages.set(
                    chatId,
                    messages.filter(msg => msg.deleteAt > now)
                );
            }
        }, 5000);
    }

    private async sendSystemMessage(chatId: number, text: string, replyToMessage?: number, deleteAfter: number = 5000) {
        try {
            const msg = await bot.sendMessage(chatId, text, {
                reply_to_message_id: replyToMessage
            });

            // Speichere die System-Nachricht zum späteren Löschen
            if (!this.systemMessages.has(chatId)) {
                this.systemMessages.set(chatId, []);
            }
            this.systemMessages.get(chatId)!.push({
                messageId: msg.message_id,
                deleteAt: Date.now() + deleteAfter
            });

            // Optional: Lösche auch die Original-Nachricht, auf die geantwortet wurde
            if (replyToMessage) {
                setTimeout(async () => {
                    try {
                        await bot.deleteMessage(chatId, replyToMessage);
                    } catch (error) {
                        console.error('Fehler beim Löschen der Original-Nachricht:', error);
                    }
                }, deleteAfter);
            }
        } catch (error) {
            console.error('Fehler beim Senden der System-Nachricht:', error);
        }
    }

    private async setupBotHandlers() {
        try {
            await bot.setMyCommands([]);
            
            // Behandle /start Kommando
            bot.onText(/\/start/, async (msg) => {
                try {
                    const chatId = msg.chat.id;
                    
                    await bot.setChatMenuButton({
                        chat_id: chatId,
                        menu_button: {
                            type: 'web_app',
                            text: '🎮 Spielen',
                            web_app: {
                                url: 'https://g4ngmmo.onrender.com/game'
                            }
                        }
                    });

                    await this.sendSystemMessage(chatId, 'Willkommen bei G4NG MMO! Der Spielen-Button wurde aktiviert.', msg.message_id);
                } catch (error) {
                    console.error('Fehler beim Setzen des Menü-Buttons:', error);
                }
            });

            // Behandle neue Chat-Nachrichten
            bot.on('message', async (msg: Message) => {
                try {
                    const chatId = msg.chat.id;
                    const userId = msg.from?.id;
                    const username = msg.from?.username || msg.from?.first_name || 'Unbekannt';
                    
                    this.activeChats.add(chatId);

                    if (msg.text && userId && !msg.text.startsWith('/')) {
                        const lastMessageTime = this.userCooldowns.get(userId) || 0;
                        const currentTime = Date.now();
                        const timeSinceLastMessage = currentTime - lastMessageTime;

                        if (timeSinceLastMessage >= 30000) {
                            this.userCooldowns.set(userId, currentTime);
                            const messageText = `👤 ${username}:\n${msg.text}`;
                            
                            for (const activeChatId of this.activeChats) {
                                try {
                                    await bot.sendMessage(activeChatId, messageText);
                                } catch (error) {
                                    console.error(`Fehler beim Senden an Chat ${activeChatId}:`, error);
                                    if ((error as any).code === 403) {
                                        this.activeChats.delete(activeChatId);
                                    }
                                }
                            }

                            // Lösche die Original-Nachricht nach einer kurzen Verzögerung
                            setTimeout(async () => {
                                try {
                                    await bot.deleteMessage(chatId, msg.message_id);
                                } catch (error) {
                                    console.error('Fehler beim Löschen der Original-Nachricht:', error);
                                }
                            }, 500);
                        } else {
                            const remainingTime = Math.ceil((30000 - timeSinceLastMessage) / 1000);
                            await this.sendSystemMessage(
                                chatId,
                                `⏳ Bitte warte noch ${remainingTime} Sekunden, bevor du eine weitere Nachricht sendest.`,
                                msg.message_id,
                                5000
                            );
                        }
                    } else if (msg.text?.startsWith('/')) {
                        return;
                    } else if (!msg.text) {
                        await this.sendSystemMessage(
                            chatId,
                            '❌ Nur Textnachrichten sind im globalen Chat erlaubt.',
                            msg.message_id,
                            5000
                        );
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
                    
                    await this.sendSystemMessage(msg.chat.id, 'Spieldaten empfangen!', undefined, 3000);
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