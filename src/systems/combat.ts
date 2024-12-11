// Kampfsystem
interface Combat {
    participants: Player[];
    status: CombatStatus;
    turns: CombatTurn[];
    rewards: Reward[];
}

enum CombatStatus {
    PREPARING,
    IN_PROGRESS,
    FINISHED,
    CANCELLED
}

interface CombatTurn {
    player: Player;
    action: CombatAction;
    timestamp: Date;
}

interface CombatAction {
    type: CombatActionType;
    target: Player[];
    value: number;
}

enum CombatActionType {
    ATTACK,
    DEFEND,
    HEAL,
    USE_ITEM,
    FLEE
}

interface Reward {
    experience: number;
    items: Item[];
    currency: number;
} 