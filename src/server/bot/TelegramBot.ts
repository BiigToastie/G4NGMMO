import TelegramBot from 'node-telegram-bot-api';
import { telegramToken, baseUrl } from '../config';

class BotHandler {
    private static instance: BotHandler;
    private bot: TelegramBot;

    private constructor() {
        this.bot = new TelegramBot(telegramToken, { 
            webHook: {
                port: process.env.PORT ? parseInt(process.env.PORT) : 3000
            }
        });

        // Setze Webhook
        this.bot.setWebHook(`${baseUrl}/webhook`);

        // Kommandos registrieren
        this.registerCommands();
    }

    public static getInstance(): BotHandler {
        if (!BotHandler.instance) {
            BotHandler.instance = new BotHandler();
        }
        return BotHandler.instance;
    }

    private registerCommands() {
        // Start Command
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const username = msg.from?.username;
            
            const welcomeMessage = `Willkommen${username ? ` @${username}` : ''}! 🎮\n\n`
                + 'Klicke auf den Button unten, um das Spiel zu starten.';
            
            await this.bot.sendMessage(chatId, welcomeMessage, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🎮 Spiel Starten', web_app: { url: baseUrl } }
                    ]]
                }
            });
        });

        // Help Command
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            const helpMessage = 'Verfügbare Befehle:\n'
                + '/start - Starte das Spiel\n'
                + '/help - Zeige diese Hilfe';
            
            await this.bot.sendMessage(chatId, helpMessage);
        });
    }

    public getBot(): TelegramBot {
        return this.bot;
    }
}

export default BotHandler; 