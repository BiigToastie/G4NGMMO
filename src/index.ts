// Biom-System
enum BiomeType {
    FOREST,
    DESERT,
    MOUNTAINS,
    SWAMP,
    TUNDRA,
    CITY
}

// Ressourcen-System
interface Resource {
    id: string;
    name: string;
    type: ResourceType;
    rarity: Rarity;
    respawnTime: number;
}

enum ResourceType {
    ORE,
    HERB,
    WOOD,
    FABRIC,
    MAGICAL
}

enum Rarity {
    COMMON,
    UNCOMMON,
    RARE,
    EPIC,
    LEGENDARY
}

// NPC-System
interface NPC {
    id: string;
    name: string;
    type: NPCType;
    level: number;
    isHostile: boolean;
    dialogue?: DialogueTree;
    shop?: Shop;
}

enum NPCType {
    MERCHANT,
    QUEST_GIVER,
    ENEMY,
    TRAINER,
    CIVILIAN
}

interface DialogueTree {
    id: string;
    text: string;
    options: DialogueOption[];
}

interface DialogueOption {
    text: string;
    nextDialogue?: DialogueTree;
    action?: () => void;
}

interface Shop {
    items: ShopItem[];
    currency: string;
}

interface ShopItem {
    item: Item;
    price: number;
    stock: number;
}

// Item-System
interface Item {
    id: string;
    name: string;
    type: ItemType;
    rarity: Rarity;
    stats?: ItemStats;
    requirements?: ItemRequirement;
    description: string;
}

enum ItemType {
    WEAPON,
    ARMOR,
    CONSUMABLE,
    MATERIAL,
    QUEST_ITEM
}

interface ItemStats {
    damage?: number;
    defense?: number;
    healing?: number;
    durability: number;
    effects?: Effect[];
}

interface ItemRequirement {
    level: number;
    class?: CharacterClass[];
    reputation?: { faction: string; level: number; };
}

interface Effect {
    type: EffectType;
    value: number;
    duration?: number;
}

enum EffectType {
    BUFF_STRENGTH,
    BUFF_INTELLIGENCE,
    BUFF_DEXTERITY,
    HEAL_OVER_TIME,
    DAMAGE_OVER_TIME
} 