import { Player, Item, Reward } from '../types';

// Entity-Interface hinzufügen
interface Entity extends Player {
    // Zusätzliche Entity-spezifische Eigenschaften können hier hinzugefügt werden
}

// Kampfsystem
export interface Combat {
    participants: Entity[];
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
    player: Entity;
    action: CombatAction;
    timestamp: Date;
}

export interface CombatAction {
    type: CombatActionType;
    target: Entity[];
    value: number;
}

export enum CombatActionType {
    ATTACK = 'ATTACK',
    DEFEND = 'DEFEND',
    HEAL = 'HEAL',
    USE_ITEM = 'USE_ITEM',
    FLEE = 'FLEE'
} 