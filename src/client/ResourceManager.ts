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
    }

    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    public async preloadAllResources(): Promise<void> {
        console.log('Starte Preload aller Ressourcen...');
        
        const resources = [
            {
                key: 'maleCharacter',
                path: '/dist/models/male_all/Animation_Mirror_Viewing_withSkin.glb'
            },
            {
                key: 'femaleCharacter',
                path: '/dist/models/female_all/Animation_Mirror_Viewing_withSkin.glb'
            }
        ];

        try {
            const progressElement = document.getElementById('loading-progress');
            let loadedCount = 0;
            const totalCount = resources.length;

            const updateProgress = (individualProgress: number) => {
                if (progressElement) {
                    // Berechne Gesamtfortschritt (Kombination aus geladenen Ressourcen und individuellem Fortschritt)
                    const totalProgress = ((loadedCount + individualProgress / 100) / totalCount) * 100;
                    progressElement.textContent = `${Math.round(totalProgress)}%`;
                }
            };

            for (const resource of resources) {
                try {
                    console.log(`Starte Laden von ${resource.key}...`);
                    await this.loadResource(resource.key, resource.path, updateProgress);
                    loadedCount++;
                    updateProgress(100); // Aktualisiere für vollständig geladene Ressource
                    console.log(`${resource.key} erfolgreich geladen (${loadedCount}/${totalCount})`);
                } catch (error) {
                    console.error(`Fehler beim Laden von ${resource.key}:`, error);
                    throw new Error(`Fehler beim Laden von ${resource.key}: ${error.message}`);
                }
            }

            console.log('Alle Ressourcen erfolgreich geladen');
        } catch (error) {
            console.error('Fehler beim Laden der Ressourcen:', error);
            throw error;
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
                        console.log(`Lade ${key}: ${Math.round(percent)}%`);
                        onProgress?.(percent);
                    }
                },
                (error) => {
                    console.error(`Fehler beim Laden von ${key}:`, error);
                    this.loadingPromises.delete(key);
                    reject(new Error(`Fehler beim Laden von ${key}: ${error.message}`));
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