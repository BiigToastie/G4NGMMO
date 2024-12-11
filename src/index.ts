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
        this.setupBotCommands();
    }

    private initializeGame() {
        console.log('Game initialized');
    }

    private setupBotCommands() {
        bot.onText(/\/start/, (msg: Message) => {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, 'Willkommen beim MMO-Spiel! Benutze /help für eine Liste der verfügbaren Befehle.');
        });

        bot.onText(/\/help/, (msg: Message) => {
            const chatId = msg.chat.id;
            const helpText = `
Verfügbare Befehle:
/start - Starte das Spiel
/help - Zeige diese Hilfe
/create_character - Erstelle einen neuen Charakter
/status - Zeige deinen Charakterstatus
/inventory - Zeige dein Inventar
            `;
            bot.sendMessage(chatId, helpText);
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

// Starte Server
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});

export default Game; 