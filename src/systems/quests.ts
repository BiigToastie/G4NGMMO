// Quest-System
interface Quest {
    id: string;
    title: string;
    description: string;
    requirements: QuestRequirement[];
    rewards: Reward[];
    type: QuestType;
    status: QuestStatus;
}

enum QuestType {
    DAILY,
    STORY,
    EVENT,
    GUILD
}

enum QuestStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED,
    FAILED
}

interface QuestRequirement {
    level?: number;
    items?: { item: Item; amount: number; }[];
    quests?: string[]; // IDs von Voraussetzungs-Quests
} 