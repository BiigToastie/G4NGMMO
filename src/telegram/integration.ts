import { Player, Guild, TelegramCallback, TelegramMessage, TelegramUser } from '../types';

// Telegram-Integration
export interface TelegramBot {
    commands: BotCommand[];
    notifications: NotificationSystem;
    messageHandler: MessageHandler;
}

export interface BotCommand {
    command: string;
    description: string;
    handler: CommandHandler;
}

export type CommandHandler = (message: TelegramMessage) => Promise<void>;

export interface MessageHandler {
    handleMessage: (message: TelegramMessage) => Promise<void>;
    handleCallback: (callback: TelegramCallback) => Promise<void>;
}

export interface NotificationSystem {
    sendToPlayer: (player: Player, message: string) => void;
    sendToGuild: (guild: Guild, message: string) => void;
    sendGlobalEvent: (message: string) => void;
} 