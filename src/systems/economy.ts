import { Player } from '../types';

// Transaction Interface
interface Transaction {
    id: string;
    from: Player;
    to: Player;
    amount: number;
    timestamp: Date;
    type: TransactionType;
    status: TransactionStatus;
}

enum TransactionType {
    TRADE = 'TRADE',
    QUEST_REWARD = 'QUEST_REWARD',
    SYSTEM = 'SYSTEM'
}

enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export { Transaction, TransactionType, TransactionStatus }; 