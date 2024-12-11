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
    private activeChats: Set<number> = new Set();
    private userCooldowns: Map<number, number> = new Map();
    private menuMessages: Map<number, number> = new Map();
    private tempMessages: Map<number, number[]> = new Map();

    private constructor() {}

    public static getInstance(): BotManager {
        if (!BotManager.instance) {
            BotManager.instance = new BotManager();
        }
        return BotManager.instance;
    }

    private async deleteOldMenu(chatId: number) {
        const oldMessageId = this.menuMessages.get(chatId);
        if (oldMessageId) {
            try {
                await this.bot?.deleteMessage(chatId, oldMessageId);
            } catch (error) {
                // Ignoriere Fehler beim Löschen alter Menüs
            }
        }
    }

    private async sendNewMenu(chatId: number, text: string, keyboard: TelegramBot.InlineKeyboardButton[][]) {
        await this.deleteOldMenu(chatId);
        const message = await this.bot?.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: keyboard
            }
        });

        if (message) {
            this.menuMessages.set(chatId, message.message_id);
        }

        return message;
    }

    private async handleCharacterMenu(chatId: number, userId: number) {
        try {
            await this.sendNewMenu(chatId,
                '👤 *Charakter-Menü*\n\n' +
                'Wähle eine Option:',
                [
                    [{ text: '🎨 Charakter erstellen/anpassen', web_app: { url: 'https://g4ngmmo.onrender.com/game' } }],
                    [{ text: '📊 Statistiken anzeigen', callback_data: 'character_stats' }],
                    [{ text: '↩️ Zurück zum Hauptmenü', callback_data: 'main_menu' }]
                ]
            );
        } catch (error) {
            console.error('Fehler beim Anzeigen des Charakter-Menüs:', error);
        }
    }

    private async handleCharacterStats(chatId: number, userId: number) {
        try {
            await this.sendNewMenu(chatId,
                `📊 *Charakter-Statistiken*\n\n` +
                `Level: 1\n` +
                `Erfahrung: 0/100\n` +
                `Angriff: 10\n` +
                `Verteidigung: 5\n` +
                `Leben: 100/100\n` +
                `Gold: 0`,
                [
                    [{ text: '↩️ Zurück zum Charakter-Menü', callback_data: 'character_menu' }]
                ]
            );
        } catch (error) {
            console.error('Fehler beim Abrufen der Charakter-Stats:', error);
        }
    }

    private async handleGuildMenu(chatId: number, userId: number) {
        try {
            await this.sendNewMenu(chatId,
                '🏰 *Gilden-Menü*\n\n' +
                'Wähle eine Option:',
                [
                    [{ text: '📝 Gilde erstellen', callback_data: 'guild_create' }],
                    [{ text: '🔍 Gilden durchsuchen', callback_data: 'guild_search' }],
                    [{ text: '⚔️ Gildenkämpfe', callback_data: 'guild_battles' }],
                    [{ text: '↩️ Zurück zum Hauptmenü', callback_data: 'main_menu' }]
                ]
            );
        } catch (error) {
            console.error('Fehler beim Anzeigen des Gilden-Menüs:', error);
        }
    }

    private async handleHelp(chatId: number) {
        try {
            await this.deleteOldMenu(chatId);
            const helpMessage = await this.bot?.sendMessage(chatId,
                '📖 *G4NG MMO - Spielhilfe*\n\n' +
                '*🌍 Über das Spiel*\n' +
                'Spiele auf Unserem Server um Fortschritte zu erzielen\n\n' +
                '*💬 Chat-System*\n' +
                '• Nachrichten die du Hier in den Chat schreibst können Alle Aktiven Spieler auch sehen\n' +
                '• Deine eigene Nachricht wird gelöscht und erscheint neu formatiert für alle (auch für dich)\n' +
                '• 30 Sekunden Cooldown zwischen Nachrichten\n\n' +
                '*📊 Charakter*\n' +
                '• Erstelle und passe deinen Charakter in der Web-App an\n' +
                '• Verbessere deine Stats durch Kämpfe und Quests\n' +
                '• Sammle Ausrüstung und Gold\n\n' +
                '*🏰 Gilden*\n' +
                '• Erstelle deine eigene Gilde oder tritt einer bei\n' +
                '• Kämpfe gemeinsam mit deinen Gildenmitgliedern\n' +
                '• Erobere Territorien und sammle Ressourcen\n\n' +
                '*⚔️ Kämpfe*\n' +
                '• PvP-System für Spieler gegen Spieler\n' +
                '• Gildenkämpfe für Territorien\n' +
                '• Spezielle Events und Turniere\n\n' +
                '*❓ Weitere Hilfe*\n' +
                'Bei Fragen kannst du jederzeit im Chat andere Spieler um Rat fragen!',
                { parse_mode: 'Markdown' }
            );

            if (helpMessage) {
                await this.addTempMessage(chatId, helpMessage.message_id);
            }
            
            const backButton = await this.sendNewMenu(chatId, 'Zurück zum Hauptmenü:', [
                [{ text: '↩️ Zurück zum Hauptmenü', callback_data: 'main_menu' }]
            ]);

            if (backButton) {
                await this.addTempMessage(chatId, backButton.message_id);
            }
        } catch (error) {
            console.error('Fehler beim Anzeigen der Hilfe:', error);
        }
    }

    private async showMainMenu(chatId: number) {
        await this.clearTempMessages(chatId);
        return await this.sendNewMenu(
            chatId,
            '🎮 *Willkommen bei G4NG MMO!*\n\n' +
            'Dies ist ein globaler Chat, in dem du mit allen anderen Spielern kommunizieren kannst. ' +
            'Schreibe einfach eine Nachricht, um mit anderen zu chatten!\n\n' +
            '_Hinweis: Nach jeder Nachricht gibt es einen 30-Sekunden Cooldown._',
            [
                [{ text: '👤 Charakter', callback_data: 'character_menu' }],
                [{ text: '🏰 Gilden-Verwaltung', callback_data: 'guild_menu' }],
                [{ text: '❓ Spielhilfe', callback_data: 'help' }]
            ]
        );
    }

    private async handleCallback(callbackQuery: TelegramBot.CallbackQuery) {
        const chatId = callbackQuery.message?.chat.id;
        const userId = callbackQuery.from.id;
        const action = callbackQuery.data;

        if (!chatId || !action) return;

        try {
            switch (action) {
                case 'character_menu':
                    await this.handleCharacterMenu(chatId, userId);
                    break;

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
                    await this.showMainMenu(chatId);
                    break;

                case 'guild_create':
                case 'guild_search':
                case 'guild_battles':
                    const tempMessage = await this.bot?.sendMessage(chatId, '🚧 Diese Funktion wird bald verfügbar sein!');
                    if (tempMessage) {
                        await this.addTempMessage(chatId, tempMessage.message_id);
                    }
                    setTimeout(async () => {
                        await this.showMainMenu(chatId);
                    }, 2000);
                    break;
            }
        } catch (error) {
            console.error('Fehler bei Callback-Verarbeitung:', error);
            const errorMessage = await this.bot?.sendMessage(chatId, 'Es gab einen Fehler. Bitte versuche es später erneut.');
            if (errorMessage) {
                await this.addTempMessage(chatId, errorMessage.message_id);
            }
            setTimeout(async () => {
                await this.showMainMenu(chatId);
            }, 2000);
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

                // Zeige Hauptmenü
                await this.showMainMenu(chatId);
            });

            // Callback Query Handler
            this.bot.on('callback_query', async (callbackQuery) => {
                await this.handleCallback(callbackQuery);
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