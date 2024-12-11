import TelegramBot from 'node-telegram-bot-api';

interface TelegramError extends Error {
    response?: {
        statusCode?: number;
    };
}

export class BotManager {
    private static instance: BotManager;
    private bot: TelegramBot | null = null;
    private isInitializing: boolean = false;
    private shutdownRequested: boolean = false;
    private activeChats: Set<number> = new Set(); // Speichert aktive Chat-IDs
    private userCooldowns: Map<number, number> = new Map(); // Speichert User-Cooldowns

    private constructor() {}

    public static getInstance(): BotManager {
        if (!BotManager.instance) {
            BotManager.instance = new BotManager();
        }
        return BotManager.instance;
    }

    private isUserInCooldown(userId: number): boolean {
        const lastMessageTime = this.userCooldowns.get(userId);
        if (!lastMessageTime) return false;

        const cooldownTime = 30 * 1000; // 30 Sekunden in Millisekunden
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        return timeSinceLastMessage < cooldownTime;
    }

    private getRemainingCooldown(userId: number): number {
        const lastMessageTime = this.userCooldowns.get(userId);
        if (!lastMessageTime) return 0;

        const cooldownTime = 30 * 1000;
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        return Math.ceil((cooldownTime - timeSinceLastMessage) / 1000);
    }

    private async handleCharacterStats(chatId: number, userId: number) {
        try {
            // TODO: Implementiere Charakter-Statistiken Abruf
            await this.bot?.sendMessage(chatId, 
                `🎮 *Charakter-Statistiken*\n\n` +
                `Level: 1\n` +
                `Erfahrung: 0/100\n` +
                `Angriff: 10\n` +
                `Verteidigung: 5\n` +
                `Leben: 100/100\n` +
                `Gold: 0`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Fehler beim Abrufen der Charakter-Stats:', error);
        }
    }

    private async handleGuildMenu(chatId: number, userId: number) {
        try {
            await this.bot?.sendMessage(chatId,
                '🏰 *Gilden-Menü*\n\n' +
                'Wähle eine Option:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📝 Gilde erstellen', callback_data: 'guild_create' }],
                            [{ text: '🔍 Gilden durchsuchen', callback_data: 'guild_search' }],
                            [{ text: '⚔️ Gildenkämpfe', callback_data: 'guild_battles' }],
                            [{ text: '↩️ Zurück', callback_data: 'main_menu' }]
                        ]
                    }
                }
            );
        } catch (error) {
            console.error('Fehler beim Anzeigen des Gilden-Menüs:', error);
        }
    }

    private async handleHelp(chatId: number) {
        try {
            await this.bot?.sendMessage(chatId,
                '❓ *G4NG MMO Hilfe*\n\n' +
                '🎮 *Spielablauf*\n' +
                'Schreibe einfach Nachrichten in diesen Chat, um mit anderen Spielern zu kommunizieren.\n\n' +
                '⏳ *Cooldown*\n' +
                'Nach jeder Nachricht musst du 30 Sekunden warten.\n\n' +
                '🏰 *Gilden*\n' +
                'Erstelle oder tritt einer Gilde bei, um gemeinsam stärker zu werden.\n\n' +
                '📊 *Statistiken*\n' +
                'Verbessere deinen Charakter durch Kämpfe und Quests.\n\n' +
                '💬 *Chat*\n' +
                'Alle Nachrichten werden an alle aktiven Spieler gesendet.',
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Fehler beim Anzeigen der Hilfe:', error);
        }
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

            // Start-Befehl Handler
            this.bot.onText(/\/start/, async (msg) => {
                const chatId = msg.chat.id;
                
                // Füge Chat zur Liste aktiver Chats hinzu
                this.activeChats.add(chatId);

                // Sende Willkommensnachricht mit Hauptmenü
                await this.bot?.sendMessage(chatId, 
                    '🎮 *Willkommen bei G4NG MMO!*\n\n' +
                    'Dies ist ein globaler Chat, in dem du mit allen anderen Spielern kommunizieren kannst. ' +
                    'Schreibe einfach eine Nachricht, um mit anderen zu chatten!\n\n' +
                    '_Hinweis: Nach jeder Nachricht gibt es einen 30-Sekunden Cooldown._',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📊 Charakter Stats', callback_data: 'character_stats' }],
                                [{ text: '🏰 Gilden-Verwaltung', callback_data: 'guild_menu' }],
                                [{ text: '❓ Spielhilfe', callback_data: 'help' }]
                            ]
                        }
                    }
                );
            });

            // Callback Query Handler
            this.bot.on('callback_query', async (callbackQuery) => {
                const chatId = callbackQuery.message?.chat.id;
                const userId = callbackQuery.from.id;
                const action = callbackQuery.data;

                if (!chatId || !action) return;

                try {
                    switch (action) {
                        case 'character_stats':
                            await this.handleCharacterStats(chatId, userId);
                            break;

                        case 'guild_menu':
                            await this.handleGuildMenu(chatId, userId);
                            break;

                        case 'help':
                            await this.handleHelp(chatId);
                            break;

                        case 'main_menu':
                            // Zurück zum Hauptmenü
                            await this.bot?.sendMessage(chatId, 
                                'Hauptmenü:',
                                {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: '📊 Charakter Stats', callback_data: 'character_stats' }],
                                            [{ text: '🏰 Gilden', callback_data: 'guild_menu' }],
                                            [{ text: '❓ Hilfe', callback_data: 'help' }]
                                        ]
                                    }
                                }
                            );
                            break;

                        // Gilden-bezogene Aktionen
                        case 'guild_create':
                        case 'guild_search':
                        case 'guild_battles':
                            // TODO: Implementiere die entsprechenden Gilden-Funktionen
                            await this.bot?.sendMessage(chatId, '🚧 Diese Funktion wird bald verfügbar sein!');
                            break;
                    }
                } catch (error) {
                    console.error('Fehler bei Callback-Verarbeitung:', error);
                    await this.bot?.sendMessage(chatId, 'Es gab einen Fehler. Bitte versuche es später erneut.');
                }
            });

            // Globaler Nachrichten-Handler
            this.bot.on('message', async (msg) => {
                const chatId = msg.chat.id;
                const userId = msg.from?.id;
                const messageId = msg.message_id;
                const text = msg.text;

                // Ignoriere Start-Befehl
                if (text === '/start') return;

                // Prüfe ob es eine gültige Nachricht ist
                if (!userId || !text || !msg.from) return;

                try {
                    // Prüfe Cooldown
                    if (this.isUserInCooldown(userId)) {
                        const remainingTime = this.getRemainingCooldown(userId);
                        const cooldownMsg = await this.bot?.sendMessage(chatId, 
                            `⏳ Bitte warte noch ${remainingTime} Sekunden bevor du wieder eine Nachricht sendest.`
                        );

                        // Lösche Cooldown-Nachricht nach 5 Sekunden
                        if (cooldownMsg) {
                            setTimeout(async () => {
                                try {
                                    await this.bot?.deleteMessage(chatId, cooldownMsg.message_id);
                                    await this.bot?.deleteMessage(chatId, messageId);
                                } catch (error) {
                                    // Ignoriere Fehler beim Löschen
                                }
                            }, 5000);
                        }
                        return;
                    }

                    // Aktualisiere Cooldown
                    this.userCooldowns.set(userId, Date.now());

                    // Formatiere Benutzernamen
                    const username = msg.from.username || msg.from.first_name || 'Unbekannt';

                    // Sende Nachricht an alle aktiven Chats
                    const promises = Array.from(this.activeChats).map(async (activeChatId) => {
                        try {
                            return await this.bot?.sendMessage(activeChatId, 
                                `${username}: ${text}`,
                                { parse_mode: 'Markdown' }
                            );
                        } catch (error) {
                            const telegramError = error as TelegramError;
                            if (telegramError.response?.statusCode === 403) {
                                // Bot wurde blockiert oder Chat wurde beendet
                                this.activeChats.delete(activeChatId);
                            }
                            return null;
                        }
                    });

                    // Warte auf alle Sendevorgänge
                    await Promise.all(promises);

                    // Lösche ursprüngliche Nachricht
                    try {
                        await this.bot?.deleteMessage(chatId, messageId);
                    } catch (error) {
                        // Ignoriere Fehler beim Löschen
                    }

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