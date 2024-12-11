import {
    BiomeType,
    ResourceType,
    Rarity,
    NPCType,
    ItemType,
    EffectType,
    CharacterClass,
    Player,
    Item,
    Zone,
    Resource,
    NPC,
    Effect
} from './types';

// Hauptanwendung
class Game {
    private players: Map<string, Player> = new Map();
    private items: Map<string, Item> = new Map();
    private zones: Map<string, Zone> = new Map();

    constructor() {
        this.initializeGame();
    }

    private initializeGame() {
        // Hier kommt die Initialisierungslogik
        console.log('Game initialized');
    }

    public addPlayer(player: Player) {
        this.players.set(player.id, player);
    }

    public getPlayer(id: string): Player | undefined {
        return this.players.get(id);
    }
}

export default Game; 