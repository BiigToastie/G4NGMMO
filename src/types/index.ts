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

// Zonen-System
export interface Zone {
    id: string;
    name: string;
    level: { min: number; max: number };
    biome: BiomeType;
    resources: Resource[];
    npcs: NPC[];
}

// Item-System
export interface Item {
    id: string;
    name: string;
    type: ItemType;
    rarity: Rarity;
    stats?: ItemStats;
    requirements?: ItemRequirement;
    description: string;
}

export interface ItemStats {
    damage?: number;
    defense?: number;
    healing?: number;
    durability: number;
    effects?: Effect[];
}

export interface ItemRequirement {
    level: number;
    class?: CharacterClass[];
    reputation?: { faction: string; level: number };
}

// Gilden-System
export interface Guild {
    id: string;
    name: string;
    leader: Player;
    members: Player[];
    level: number;
    resources: GuildResources;
    permissions: GuildPermissions;
    rank: Map<string, GuildRank>;
}

export interface GuildResources {
    currency: number;
    materials: { [key: string]: number };
    storage: {
        used: number;
        total: number;
    };
}

export interface GuildPermissions {
    canInvite: boolean;
    canKick: boolean;
    canManageResources: boolean;
}

export enum GuildRank {
    LEADER = 'LEADER',
    OFFICER = 'OFFICER',
    VETERAN = 'VETERAN',
    MEMBER = 'MEMBER',
    RECRUIT = 'RECRUIT'
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

// Belohnungssystem
export interface Reward {
    experience: number;
    items: Item[];
    currency: number;
}

// Zusätzliche Typen
export interface NPC {
    id: string;
    name: string;
    type: NPCType;
    level: number;
    isHostile: boolean;
}

export enum NPCType {
    MERCHANT = 'MERCHANT',
    QUEST_GIVER = 'QUEST_GIVER',
    ENEMY = 'ENEMY',
    TRAINER = 'TRAINER',
    CIVILIAN = 'CIVILIAN'
}

export interface Resource {
    id: string;
    name: string;
    type: ResourceType;
    rarity: Rarity;
    respawnTime: number;
}

export enum ResourceType {
    ORE = 'ORE',
    HERB = 'HERB',
    WOOD = 'WOOD',
    FABRIC = 'FABRIC',
    MAGICAL = 'MAGICAL'
}

export enum Rarity {
    COMMON = 'COMMON',
    UNCOMMON = 'UNCOMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
}

export enum BiomeType {
    FOREST = 'FOREST',
    DESERT = 'DESERT',
    MOUNTAINS = 'MOUNTAINS',
    SWAMP = 'SWAMP',
    TUNDRA = 'TUNDRA',
    CITY = 'CITY'
}

export interface Effect {
    type: EffectType;
    value: number;
    duration?: number;
}

export enum EffectType {
    BUFF_STRENGTH = 'BUFF_STRENGTH',
    BUFF_INTELLIGENCE = 'BUFF_INTELLIGENCE',
    BUFF_DEXTERITY = 'BUFF_DEXTERITY',
    HEAL_OVER_TIME = 'HEAL_OVER_TIME',
    DAMAGE_OVER_TIME = 'DAMAGE_OVER_TIME'
}

export enum ItemType {
    WEAPON = 'WEAPON',
    ARMOR = 'ARMOR',
    CONSUMABLE = 'CONSUMABLE',
    MATERIAL = 'MATERIAL',
    QUEST_ITEM = 'QUEST_ITEM'
} 