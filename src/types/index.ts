// Basis-Spieler-Interface
export interface Player {
    id: string;
    name: string;
    level: number;
    experience: number;
    class: CharacterClass;
    inventory: Inventory;
    stats: PlayerStats;
    guild?: Guild;
    position: Position;
}

// Charakter-Klassen
export enum CharacterClass {
    WARRIOR = 'WARRIOR',
    MAGE = 'MAGE',
    HEALER = 'HEALER',
    RANGER = 'RANGER'
}

// Spieler-Statistiken
export interface PlayerStats {
    health: number;
    mana: number;
    strength: number;
    intelligence: number;
    dexterity: number;
}

// Inventar
export interface Inventory {
    items: Item[];
    currency: number;
    maxSlots: number;
}

// Position im Spiel
export interface Position {
    x: number;
    y: number;
    z: number;
    zone: Zone;
}

// Telegram-spezifische Typen
export interface TelegramCallback {
    id: string;
    from: TelegramUser;
    data: string;
    message?: TelegramMessage;
}

export interface TelegramMessage {
    id: string;
    from: TelegramUser;
    text: string;
    date: Date;
}

export interface TelegramUser {
    id: string;
    username?: string;
    firstName: string;
    lastName?: string;
} 