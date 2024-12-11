import TelegramBot from 'node-telegram-bot-api';

export class BotManager {
    private static instance: BotManager;
    private bot: TelegramBot | null = null;
    private isInitializing: boolean = false;
    private shutdownRequested: boolean = false;
    private readonly WELCOME_MESSAGE = `
🎮 Willkommen bei G4NG MMO! 🎮

Ein spannendes MMO-Abenteuer erwartet dich! Hier sind deine Optionen:

🎯 /start - Starte dein Abenteuer
👤 /character - Erstelle oder bearbeite deinen Charakter
🌍 /world - Erkunde die Spielwelt
📜 /quests - Verfügbare Quests
⚔️ /fight - PvP-Kampfsystem
🏰 /guild - Gilden-Management
💰 /shop - Händler und Gegenstände
❓ /help - Hilfe und Befehle

Viel Spaß beim Spielen! 🚀
    `;

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

            // Willkommensnachricht
            this.bot.onText(/\/start/, async (msg) => {
                const chatId = msg.chat.id;
                const userId = msg.from?.id.toString();
                const username = msg.from?.username || msg.from?.first_name || 'Abenteurer';

                try {
                    // Lösche vorherige Nachrichten
                    const messages = await this.bot?.getUpdates();
                    messages?.forEach(async (update) => {
                        if (update.message?.chat.id === chatId) {
                            try {
                                await this.bot?.deleteMessage(chatId, update.message.message_id);
                            } catch (error) {
                                // Ignoriere Fehler beim Löschen alter Nachrichten
                            }
                        }
                    });

                    // Sende Willkommensnachricht
                    await this.bot?.sendMessage(chatId, 
                        `Hallo ${username}! ${this.WELCOME_MESSAGE}`, 
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '👤 Charakter erstellen', callback_data: 'create_character' },
                                        { text: '🌍 Welt erkunden', callback_data: 'explore_world' }
                                    ],
                                    [
                                        { text: '⚔️ PvP', callback_data: 'pvp' },
                                        { text: '🏰 Gilde', callback_data: 'guild' }
                                    ]
                                ]
                            }
                        }
                    );
                } catch (error) {
                    console.error('Fehler beim Senden der Willkommensnachricht:', error);
                    await this.bot?.sendMessage(chatId, 'Es gab einen Fehler. Bitte versuche es später erneut.');
                }
            });

            // Callback Query Handler
            this.bot.on('callback_query', async (callbackQuery) => {
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const action = callbackQuery.data;

                if (!chatId || !messageId || !action) return;

                try {
                    switch (action) {
                        case 'create_character':
                            await this.bot?.editMessageText('🎨 Charakter-Editor wird geladen...', {
                                chat_id: chatId,
                                message_id: messageId
                            });
                            // Hier später die Charaktererstellung implementieren
                            break;

                        case 'explore_world':
                            await this.bot?.editMessageText('🗺️ Lade Weltkarte...', {
                                chat_id: chatId,
                                message_id: messageId
                            });
                            // Hier später die Weltexploration implementieren
                            break;

                        case 'pvp':
                            await this.bot?.editMessageText('⚔️ Suche nach Gegnern...', {
                                chat_id: chatId,
                                message_id: messageId
                            });
                            // Hier später das PvP-System implementieren
                            break;

                        case 'guild':
                            await this.bot?.editMessageText('🏰 Lade Gilden-Informationen...', {
                                chat_id: chatId,
                                message_id: messageId
                            });
                            // Hier später das Gilden-System implementieren
                            break;
                    }
                } catch (error) {
                    console.error('Fehler bei Callback-Verarbeitung:', error);
                    await this.bot?.sendMessage(chatId, 'Es gab einen Fehler. Bitte versuche es später erneut.');
                }
            });

            // Allgemeiner Nachrichten-Handler
            this.bot.on('message', async (msg) => {
                const chatId = msg.chat.id;
                const messageId = msg.message_id;
                const text = msg.text;

                // Ignoriere Befehle
                if (text?.startsWith('/')) return;

                try {
                    // Lösche Nachricht nach kurzer Verzögerung
                    setTimeout(async () => {
                        try {
                            await this.bot?.deleteMessage(chatId, messageId);
                        } catch (error) {
                            // Ignoriere Fehler beim Löschen
                        }
                    }, 5000);

                } catch (error) {
                    console.error('Fehler bei Nachrichtenverarbeitung:', error);
                }
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