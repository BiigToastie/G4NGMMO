// Gilden-System
interface Guild {
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
interface GuildPermissions {
    canInvite: boolean;
    canKick: boolean;
    canManageResources: boolean;
    // Leicht erweiterbar für neue Berechtigungen
}

interface GuildResources {
    currency: number;
    materials: { [key: string]: number };
    storage: {
        used: number;
        total: number;
    };
}

// Gilden-Ränge
enum GuildRank {
    LEADER,
    OFFICER,
    VETERAN,
    MEMBER,
    RECRUIT
} 