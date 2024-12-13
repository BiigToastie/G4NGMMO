import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export class ResourceManager {
    private static instance: ResourceManager | null = null;
    private resources: Map<string, GLTF>;
    private loader: GLTFLoader;
    private loadingPromises: Map<string, Promise<GLTF>>;

    private constructor() {
        this.resources = new Map();
        this.loader = new GLTFLoader();
        this.loadingPromises = new Map();
        console.log('ResourceManager initialisiert');
    }

    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    private updateUI(progress: number, message: string) {
        const progressElement = document.getElementById('loading-progress');
        const loadingText = document.querySelector('#loading-overlay h2');
        if (progressElement) {
            progressElement.textContent = `${Math.round(progress)}%`;
        }
        if (loadingText) {
            loadingText.textContent = message;
        }
        console.log(`${message} - ${Math.round(progress)}%`);
    }

    public async preloadAllResources(): Promise<void> {
        console.log('Starte Preload aller Ressourcen...');
        this.updateUI(0, 'Initialisiere Ressourcen...');
        
        const resources = [
            {
                key: 'maleCharacter',
                path: './models/male_all/Animation_Mirror_Viewing_withSkin.glb'
            },
            {
                key: 'femaleCharacter',
                path: './models/female_all/Animation_Mirror_Viewing_withSkin.glb'
            }
        ];

        try {
            let loadedCount = 0;
            const totalCount = resources.length;

            const updateProgress = (individualProgress: number, currentResource: string) => {
                const totalProgress = ((loadedCount + individualProgress / 100) / totalCount) * 100;
                this.updateUI(totalProgress, `Lade ${currentResource}...`);
            };

            for (const resource of resources) {
                try {
                    console.log(`Starte Laden von ${resource.key} von Pfad: ${resource.path}`);
                    await this.loadResource(
                        resource.key, 
                        resource.path, 
                        (progress) => updateProgress(progress, resource.key)
                    );
                    loadedCount++;
                    updateProgress(100, resource.key);
                } catch (error: any) {
                    console.error(`Fehler beim Laden von ${resource.key}:`, error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.showError(`Fehler beim Laden von ${resource.key}: ${errorMessage}`);
                    throw error;
                }
            }

            this.updateUI(100, 'Alle Ressourcen geladen!');
            console.log('Alle Ressourcen erfolgreich geladen');

            // Zeige Charakterauswahl nach erfolgreichem Laden
            const characterSelection = document.getElementById('character-selection');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            if (characterSelection) {
                characterSelection.style.display = 'flex';
            }

        } catch (error: any) {
            console.error('Fehler beim Laden der Ressourcen:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Fehler beim Laden der Ressourcen: ${errorMessage}`);
            throw error;
        }
    }

    private showError(message: string) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    private async loadResource(
        key: string, 
        path: string, 
        onProgress?: (progress: number) => void
    ): Promise<GLTF> {
        console.log(`Lade Ressource: ${key} von ${path}`);
        
        // Prüfe ob bereits geladen
        if (this.resources.has(key)) {
            return this.resources.get(key)!;
        }

        // Prüfe ob bereits am Laden
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key)!;
        }

        // Starte neuen Ladevorgang
        const loadingPromise = new Promise<GLTF>((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    this.resources.set(key, gltf);
                    this.loadingPromises.delete(key);
                    console.log(`Ressource ${key} erfolgreich geladen`);
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
                    console.error(`Fehler beim Laden von ${key}:`, errorMessage);
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