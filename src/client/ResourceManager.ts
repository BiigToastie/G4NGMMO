import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export class ResourceManager {
    private static instance: ResourceManager | null = null;
    private resources: Map<string, GLTF>;
    private loader: GLTFLoader;
    private loadingPromises: Map<string, Promise<GLTF>>;

    private constructor() {
        this.debugLog('Initialisiere ResourceManager...');
        this.resources = new Map();
        this.loader = new GLTFLoader();
        this.loadingPromises = new Map();
        this.debugLog('ResourceManager erfolgreich initialisiert');
    }

    private debugLog(message: string, isError: boolean = false) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            const logEntry = document.createElement('div');
            logEntry.style.color = isError ? '#ec3942' : '#f5f5f5';
            logEntry.textContent = `[${timestamp}] ${message}`;
            debugInfo.appendChild(logEntry);
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
    }

    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    private updateUI(progress: number, message: string) {
        this.debugLog(`UI Update: ${message} (${progress}%)`);
        const progressElement = document.getElementById('loading-progress');
        const loadingText = document.querySelector('#loading-overlay h2');
        
        if (progressElement) {
            progressElement.textContent = `${Math.round(progress)}%`;
        } else {
            this.debugLog('Progress-Element nicht gefunden!', true);
        }
        
        if (loadingText) {
            loadingText.textContent = message;
        } else {
            this.debugLog('Loading-Text-Element nicht gefunden!', true);
        }
    }

    public async preloadAllResources(): Promise<void> {
        this.debugLog('Starte Preload aller Ressourcen...');
        this.updateUI(0, 'Initialisiere Ressourcen...');
        
        const resources = [
            {
                key: 'maleCharacter',
                path: 'dist/models/male_all/Animation_Mirror_Viewing_withSkin.glb'
            },
            {
                key: 'femaleCharacter',
                path: 'dist/models/female_all/Animation_Mirror_Viewing_withSkin.glb'
            }
        ];

        this.debugLog(`Ressourcen zum Laden: ${JSON.stringify(resources, null, 2)}`);

        try {
            let loadedCount = 0;
            const totalCount = resources.length;

            const updateProgress = (individualProgress: number, currentResource: string) => {
                const totalProgress = ((loadedCount + individualProgress / 100) / totalCount) * 100;
                this.updateUI(totalProgress, `Lade ${currentResource}...`);
            };

            for (const resource of resources) {
                this.debugLog(`\nStarte Laden von Ressource: ${resource.key}`);
                this.debugLog(`Pfad: ${resource.path}`);
                
                try {
                    await this.loadResource(
                        resource.key, 
                        resource.path, 
                        (progress) => {
                            this.debugLog(`Ladefortschritt für ${resource.key}: ${progress}%`);
                            updateProgress(progress, resource.key);
                        }
                    );
                    
                    loadedCount++;
                    this.debugLog(`${resource.key} erfolgreich geladen (${loadedCount}/${totalCount})`);
                    updateProgress(100, resource.key);
                } catch (error: any) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.debugLog(`Fehler beim Laden von ${resource.key}: ${errorMessage}`, true);
                    throw error;
                }
            }

            this.debugLog('Alle Ressourcen erfolgreich geladen');
            this.updateUI(100, 'Alle Ressourcen geladen!');

            // Zeige Charakterauswahl nach erfolgreichem Laden
            const characterSelection = document.getElementById('character-selection');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            if (loadingOverlay) {
                this.debugLog('Verstecke Ladebildschirm');
                loadingOverlay.style.display = 'none';
            } else {
                this.debugLog('Loading-Overlay nicht gefunden!', true);
            }
            
            if (characterSelection) {
                this.debugLog('Zeige Charakterauswahl');
                characterSelection.style.display = 'flex';
            } else {
                this.debugLog('Character-Selection nicht gefunden!', true);
            }

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.debugLog(`Fehler beim Laden der Ressourcen: ${errorMessage}`, true);
            throw error;
        }
    }

    private async loadResource(
        key: string, 
        path: string, 
        onProgress?: (progress: number) => void
    ): Promise<GLTF> {
        this.debugLog(`Starte Laden von Ressource: ${key}`);
        this.debugLog(`Pfad: ${path}`);
        
        // Prüfe ob bereits geladen
        if (this.resources.has(key)) {
            this.debugLog(`${key} bereits geladen, verwende Cache`);
            return this.resources.get(key)!;
        }

        // Prüfe ob bereits am Laden
        if (this.loadingPromises.has(key)) {
            this.debugLog(`${key} wird bereits geladen, warte auf Abschluss`);
            return this.loadingPromises.get(key)!;
        }

        // Starte neuen Ladevorgang
        const loadingPromise = new Promise<GLTF>((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    this.debugLog(`${key} erfolgreich geladen`);
                    this.resources.set(key, gltf);
                    this.loadingPromises.delete(key);
                    resolve(gltf);
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        const percent = (progress.loaded / progress.total) * 100;
                        onProgress?.(percent);
                    }
                },
                (error) => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.debugLog(`Fehler beim Laden von ${key}: ${errorMessage}`, true);
                    this.loadingPromises.delete(key);
                    reject(new Error(`Fehler beim Laden von ${key}: ${errorMessage}`));
                }
            );
        });

        this.loadingPromises.set(key, loadingPromise);
        return loadingPromise;
    }

    public getResource(key: string): GLTF | undefined {
        return this.resources.get(key);
    }

    public clearResources(): void {
        this.resources.clear();
        this.loadingPromises.clear();
    }
} 