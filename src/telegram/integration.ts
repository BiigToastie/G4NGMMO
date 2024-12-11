// Telegram-Integration
interface TelegramBot {
    commands: BotCommand[];
    notifications: NotificationSystem;
    messageHandler: MessageHandler;
}

interface BotCommand {
    command: string;
    description: string;
    handler: CommandHandler;
}

type CommandHandler = (message: TelegramMessage) => Promise<void>;

interface MessageHandler {
    handleMessage: (message: TelegramMessage) => Promise<void>;
    handleCallback: (callback: TelegramCallback) => Promise<void>;
}

interface TelegramMessage {
    id: string;
    from: TelegramUser;
    text: string;
    date: Date;
}

interface TelegramUser {
    id: string;
    username?: string;
    firstName: string;
}

interface NotificationSystem {
    sendToPlayer: (player: Player, message: string) => void;
    sendToGuild: (guild: Guild, message: string) => void;
    sendGlobalEvent: (message: string) => void;
} 