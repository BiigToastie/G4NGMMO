import { 
    LoadingManager, 
    TextureLoader, 
    Texture,
    Cache
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

interface ResourceList {
    models: {
        male: string[];
        female: string[];
    };
    textures: string[];
}

interface LoaderCallbacks {
    onStart?: (url: string, itemsLoaded: number, itemsTotal: number) => void;
    onProgress?: (url: string, itemsLoaded: number, itemsTotal: number) => void;
    onError?: (url: string) => void;
}

export class ResourceManager {
    private static instance: ResourceManager;
    private loadingManager: LoadingManager;
    private gltfLoader: GLTFLoader;
    private textureLoader: TextureLoader;
    private modelCache: Map<string, GLTF>;
    private textureCache: Map<string, Texture>;
    private resourceList: ResourceList = {
        models: {
            male: [
                '/models/male_all/Animation_Mirror_Viewing_withSkin.glb',
                // Hier weitere männliche Modelle hinzufügen
            ],
            female: [
                '/models/female_all/Animation_Mirror_Viewing_withSkin.glb',
                // Hier weitere weibliche Modelle hinzufügen
            ]
        },
        textures: [
            // Hier Texturen hinzufügen
        ]
    };

    private constructor() {
        this.loadingManager = new LoadingManager();
        this.setupLoadingManager();

        // GLTF Loader Setup
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        this.gltfLoader.setDRACOLoader(dracoLoader);

        // Texture Loader Setup
        this.textureLoader = new TextureLoader(this.loadingManager);

        // Initialize caches
        this.modelCache = new Map();
        this.textureCache = new Map();

        // Enable THREE.js caching
        Cache.enabled = true;
    }

    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    private setupLoadingManager(): void {
        this.loadingManager.onStart = (url: string, itemsLoaded: number, itemsTotal: number) => {
            console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
            // Zeige Lade-Overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'flex';
        };

        this.loadingManager.onLoad = () => {
            console.log('Loading complete!');
            // Verstecke Lade-Overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };

        this.loadingManager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
            const progress = (itemsLoaded / itemsTotal * 100).toFixed(2);
            console.log(`Loading file: ${url} - ${progress}% loaded`);
            
            // Update Lade-Fortschritt
            const progressBar = document.getElementById('loading-progress');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        };

        this.loadingManager.onError = (url: string) => {
            console.error('Error loading:', url);
            // Zeige Fehler im UI
            const loadingText = document.getElementById('loading-text');
            if (loadingText) {
                loadingText.textContent = `Fehler beim Laden von: ${url}`;
                loadingText.style.color = 'red';
            }
        };
    }

    public async preloadAllResources(): Promise<void> {
        console.log('Starting resource preload...');
        console.log('Ressourcenliste:', this.resourceList);
        
        try {
            // Lade alle männlichen Modelle
            console.log('Lade männliche Modelle...');
            for (const modelPath of this.resourceList.models.male) {
                console.log(`Lade männliches Modell: ${modelPath}`);
                const model = await this.loadModel(modelPath);
                console.log(`Männliches Modell geladen: ${modelPath}`, model);
            }

            // Lade alle weiblichen Modelle
            console.log('Lade weibliche Modelle...');
            for (const modelPath of this.resourceList.models.female) {
                console.log(`Lade weibliches Modell: ${modelPath}`);
                const model = await this.loadModel(modelPath);
                console.log(`Weibliches Modell geladen: ${modelPath}`, model);
            }

            // Lade alle Texturen
            console.log('Lade Texturen...');
            for (const texturePath of this.resourceList.textures) {
                console.log(`Lade Textur: ${texturePath}`);
                const texture = await this.loadTexture(texturePath);
                console.log(`Textur geladen: ${texturePath}`, texture);
            }

            console.log('Cache-Status nach dem Laden:');
            console.log('Model Cache:', this.modelCache);
            console.log('Texture Cache:', this.textureCache);

            console.log('All resources preloaded successfully!');
            await this.saveToIndexedDB();
        } catch (error) {
            console.error('Error during resource preload:', error);
            throw error;
        }
    }

    private async loadModel(path: string): Promise<GLTF> {
        console.log(`loadModel aufgerufen für: ${path}`);
        
        if (this.modelCache.has(path)) {
            console.log(`Modell aus Cache geladen: ${path}`);
            return this.modelCache.get(path)!;
        }

        try {
            console.log(`Lade Modell von Server: ${path}`);
            const gltf = await new Promise<GLTF>((resolve, reject) => {
                this.gltfLoader.load(
                    path,
                    (result: GLTF) => {
                        console.log(`Modell erfolgreich geladen: ${path}`);
                        resolve(result);
                    },
                    (progress: ProgressEvent) => {
                        const percent = (progress.loaded / progress.total * 100).toFixed(2);
                        console.log(`Ladefortschritt für ${path}: ${percent}%`);
                    },
                    (error: ErrorEvent) => {
                        console.error(`Fehler beim Laden von ${path}:`, error);
                        reject(error);
                    }
                );
            });
            
            console.log(`Füge Modell zum Cache hinzu: ${path}`);
            this.modelCache.set(path, gltf);
            return gltf;
        } catch (error) {
            console.error(`Error loading model ${path}:`, error);
            throw error;
        }
    }

    public async getModel(path: string): Promise<GLTF> {
        return this.loadModel(path);
    }

    public async getTexture(path: string): Promise<Texture> {
        return this.loadTexture(path);
    }

    private async loadTexture(path: string): Promise<Texture> {
        if (this.textureCache.has(path)) {
            return this.textureCache.get(path)!;
        }

        try {
            const texture = await new Promise<Texture>((resolve, reject) => {
                this.textureLoader.load(path, resolve, undefined, reject);
            });
            
            this.textureCache.set(path, texture);
            return texture;
        } catch (error) {
            console.error(`Error loading texture ${path}:`, error);
            throw error;
        }
    }

    private async saveToIndexedDB(): Promise<void> {
        const request = indexedDB.open('GameResources', 1);

        request.onerror = (event: Event) => {
            console.error('IndexedDB error:', event);
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('models')) {
                db.createObjectStore('models');
            }
            if (!db.objectStoreNames.contains('textures')) {
                db.createObjectStore('textures');
            }
        };

        request.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['models', 'textures'], 'readwrite');
            
            // Speichere Modelle
            const modelStore = transaction.objectStore('models');
            this.modelCache.forEach((value, key) => {
                modelStore.put(value.scene.toJSON(), key);
            });

            // Speichere Texturen
            const textureStore = transaction.objectStore('textures');
            this.textureCache.forEach((value, key) => {
                textureStore.put(value.toJSON(), key);
            });

            transaction.oncomplete = () => {
                console.log('Resources saved to IndexedDB');
            };
        };
    }
} 