export class GameHUD {
    private container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'game-hud';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.innerHTML = `
            <div class="hud-top" style="position: absolute; top: 10px; left: 10px; color: white; font-family: Arial;">
                <div id="player-info" style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
                    <div id="player-name">Spieler: ...</div>
                    <div id="player-class">Klasse: ...</div>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);
    }

    public updatePlayerInfo(name: string, characterClass: string): void {
        const nameElement = document.getElementById('player-name');
        const classElement = document.getElementById('player-class');
        
        if (nameElement) nameElement.textContent = `Spieler: ${name}`;
        if (classElement) classElement.textContent = `Klasse: ${characterClass}`;
    }

    public dispose(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 