import TelegramBot from 'node-telegram-bot-api';

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

                // Sende Willkommensnachricht
                await this.bot?.sendMessage(chatId, 'Willkommen bei G4NGMMO ⚔️');
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
                if (!userId || !text) return;

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
                            if (error.response?.statusCode === 403) {
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