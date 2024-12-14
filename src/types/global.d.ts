import { CharacterCreator } from '../client/character/CharacterCreator';

declare global {
    interface Window {
        logDebug: (message: string) => void;
        characterCreator: CharacterCreator | null;
        CharacterCreator: typeof CharacterCreator;
    }
}

export {}; 