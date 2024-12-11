import { CharacterCreator } from './character/CharacterCreator';

// Initialisiere die Charaktererstellung, wenn wir uns auf der character.html Seite befinden
if (window.location.pathname.includes('character.html')) {
    window.addEventListener('DOMContentLoaded', () => {
        new CharacterCreator();
    });
} 