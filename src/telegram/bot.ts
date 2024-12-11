import TelegramBot from 'node-telegram-bot-api';

export class BotManager {
    private static instance: BotManager;
    private bot: TelegramBot | null = null;
    private isInitializing: boolean = false;
    private shutdownRequested: boolean = false;

    private constructor() {}

    public static getInstance(): BotManager {
        if (!BotManager.instance) {
            BotManager.instance = new BotManager();
        }
        return BotManager.instance;
    }

    public async initialize() {
        if (this.isInitializing || this.shutdownRequested) {
            return;
        }

        try {
            this.isInitializing = true;
            const token = process.env.TELEGRAM_BOT_TOKEN;
            
            if (!token) {
                throw new Error('TELEGRAM_BOT_TOKEN ist nicht definiert');
            }

            this.bot = new TelegramBot(token, {
                polling: true
            });

            console.log('Telegram Bot erfolgreich initialisiert');

        } catch (error) {
            if (error instanceof Error) {
                console.error('Fehler beim Initialisieren des Bots:', error.message);
            }
        } finally {
            this.isInitializing = false;
        }
    }

    public async shutdown() {
        this.shutdownRequested = true;
        if (this.bot) {
            await this.bot.stopPolling();
            this.bot = null;
        }
    }
} 