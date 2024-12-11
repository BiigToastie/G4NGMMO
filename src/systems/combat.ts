import { Player } from '../types';

// Kampfsystem
export interface Combat {
    participants: Player[];
    status: CombatStatus;
    turns: CombatTurn[];
    rewards: Reward[];
}

export enum CombatStatus {
    PREPARING = 'PREPARING',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED'
}

export interface CombatTurn {
    player: Player;
    action: CombatAction;
    timestamp: Date;
}

export interface CombatAction {
    type: CombatActionType;
    target: Player[];
    value: number;
}

export enum CombatActionType {
    ATTACK = 'ATTACK',
    DEFEND = 'DEFEND',
    HEAL = 'HEAL',
    USE_ITEM = 'USE_ITEM',
    FLEE = 'FLEE'
}

export interface Reward {
    experience: number;
    items: Item[];
    currency: number;
} 