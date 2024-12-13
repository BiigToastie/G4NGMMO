import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

interface ModelResponse {
    success: boolean;
    path: string;
    files: string[];
}

interface LoaderOptions {
    onProgress?: (url: string, loaded: number, total: number) => void;
    onError?: (error: Error) => void;
}

export class ResourceManager {
    private static instance: ResourceManager | null = null;
    private loader: GLTFLoader;
    private loadingManager: LoadingManager;
    private debugElement: HTMLElement | null;
    private resources: Map<string, GLTF>;

    private constructor() {
        this.debugElement = document.getElementById('debug-info');
        this.resources = new Map();
        this.loadingManager = new LoadingManager(
            // onLoad
            () => {
                this.debugLog('Alle Ressourcen geladen', false);
                this.updateUI(100, 'Laden abgeschlossen');
            },
            // onProgress
            (url: string, loaded: number, total: number) => {
                const progress = (loaded / total) * 100;
                this.debugLog(`Lade ${url}: ${Math.round(progress)}%`);
                this.updateUI(progress, `Lade ${url}`);
            },
            // onError
            (url: string) => {
                const errorMessage = `Fehler beim Laden von ${url}`;
                this.debugLog(errorMessage, true);
                this.updateUI(0, errorMessage);
            }
        );
        this.loader = new GLTFLoader(this.loadingManager);
    }

    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    private debugLog(message: string, isError: boolean = false): void {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        
        if (this.debugElement) {
            const logEntry = document.createElement('div');
            logEntry.style.color = isError ? '#ec3942' : '#f5f5f5';
            logEntry.textContent = `[${timestamp}] ${message}`;
            this.debugElement.appendChild(logEntry);
            this.debugElement.scrollTop = this.debugElement.scrollHeight;
        }
    }

    private updateUI(progress: number, message: string): void {
        const loadingProgress = document.getElementById('loading-progress');
        if (loadingProgress) {
            loadingProgress.textContent = `${Math.round(progress)}%`;
        }

        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('h2');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }

    public async preloadAllResources(): Promise<void> {
        try {
            this.debugLog('Starte Ressourcenladung...');
            
            // Prüfe Modell-Verzeichnis
            const response = await fetch('/debug/models');
            const data = await response.json() as ModelResponse;
            
            if (!data.success) {
                throw new Error('Modell-Verzeichnis nicht gefunden');
            }

            this.debugLog(`Modell-Verzeichnis gefunden: ${data.path}`);
            this.debugLog(`Verfügbare Dateien: ${JSON.stringify(data.files)}`);

            // Lade Modelle
            const maleModel = await this.loader.loadAsync('models/male_all/Animation_Mirror_Viewing_withSkin.glb');
            this.resources.set('maleCharacter', maleModel);
            this.debugLog('Männliches Modell geladen');

            const femaleModel = await this.loader.loadAsync('models/female_all/Animation_Mirror_Viewing_withSkin.glb');
            this.resources.set('femaleCharacter', femaleModel);
            this.debugLog('Weibliches Modell geladen');

            this.debugLog('Alle Modelle erfolgreich geladen');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.debugLog(`Fehler beim Laden der Ressourcen: ${errorMessage}`, true);
            throw error;
        }
    }

    public getResource(key: string): GLTF | undefined {
        return this.resources.get(key);
    }
} 