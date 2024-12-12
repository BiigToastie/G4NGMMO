import { GameManager } from './GameManager';
import WebApp from '@twa-dev/sdk';

document.addEventListener('DOMContentLoaded', () => {
    // Verstecke den Ladebildschirm wenn alles geladen ist
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    // Initialisiere das Spiel
    const gameManager = GameManager.getInstance();
    
    // Starte mit der Charaktererstellung
    gameManager.startCharacterCreation();

    // Event Listener für das Beenden des Spiels
    window.addEventListener('beforeunload', () => {
        gameManager.dispose();
    });

    // Telegram WebApp Initialisierung
    if (WebApp.isInitialized) {
        WebApp.ready();
        WebApp.expand();
    }
}); 