import { Reward, Item } from '../types';

// Quest-System
export interface Quest {
    id: string;
    title: string;
    description: string;
    requirements: QuestRequirement[];
    rewards: Reward[];
    type: QuestType;
    status: QuestStatus;
}

export enum QuestType {
    DAILY = 'DAILY',
    STORY = 'STORY',
    EVENT = 'EVENT',
    GUILD = 'GUILD'
}

export enum QuestStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface QuestRequirement {
    level?: number;
    items?: { item: Item; amount: number; }[];
    quests?: string[]; // IDs von Voraussetzungs-Quests
} 