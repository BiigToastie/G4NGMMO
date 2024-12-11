import { Player } from '../types';

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

// Erweiterbare Gilden-Berechtigungen
export interface GuildPermissions {
    canInvite: boolean;
    canKick: boolean;
    canManageResources: boolean;
    // Leicht erweiterbar für neue Berechtigungen
}

export interface GuildResources {
    currency: number;
    materials: { [key: string]: number };
    storage: {
        used: number;
        total: number;
    };
}

// Gilden-Ränge
export enum GuildRank {
    LEADER = 'LEADER',
    OFFICER = 'OFFICER',
    VETERAN = 'VETERAN',
    MEMBER = 'MEMBER',
    RECRUIT = 'RECRUIT'
} 