import { 
    LoadingManager, 
    TextureLoader, 
    Texture,
    Cache
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

interface ResourceList {
    models: {
        male: string[];
        female: string[];
    };
    textures: string[];
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
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
        };

        this.loadingManager.onLoad = () => {
            console.log('Loading complete!');
        };

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal * 100).toFixed(2);
            console.log(`Loading file: ${url} - ${progress}% loaded`);
        };

        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
        };
    }

    public async preloadAllResources(): Promise<void> {
        console.log('Starting resource preload...');
        
        try {
            // Lade alle männlichen Modelle
            for (const modelPath of this.resourceList.models.male) {
                await this.loadModel(modelPath);
            }

            // Lade alle weiblichen Modelle
            for (const modelPath of this.resourceList.models.female) {
                await this.loadModel(modelPath);
            }

            // Lade alle Texturen
            for (const texturePath of this.resourceList.textures) {
                await this.loadTexture(texturePath);
            }

            console.log('All resources preloaded successfully!');
            this.saveToIndexedDB();
        } catch (error) {
            console.error('Error during resource preload:', error);
        }
    }

    private async loadModel(path: string): Promise<GLTF> {
        if (this.modelCache.has(path)) {
            return this.modelCache.get(path)!;
        }

        try {
            const gltf = await new Promise<GLTF>((resolve, reject) => {
                this.gltfLoader.load(path, resolve, undefined, reject);
            });
            
            this.modelCache.set(path, gltf);
            return gltf;
        } catch (error) {
            console.error(`Error loading model ${path}:`, error);
            throw error;
        }
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

    public async getModel(path: string): Promise<GLTF> {
        return this.loadModel(path);
    }

    public async getTexture(path: string): Promise<Texture> {
        return this.loadTexture(path);
    }

    private saveToIndexedDB(): void {
        const request = indexedDB.open('GameResources', 1);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('models')) {
                db.createObjectStore('models');
            }
            if (!db.objectStoreNames.contains('textures')) {
                db.createObjectStore('textures');
            }
        };

        request.onsuccess = (event) => {
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

    private async loadFromIndexedDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GameResources', 1);

            request.onerror = () => reject(new Error('Failed to open IndexedDB'));

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction(['models', 'textures'], 'readonly');
                
                // Lade Modelle
                const modelStore = transaction.objectStore('models');
                modelStore.getAll().onsuccess = (event) => {
                    const models = (event.target as IDBRequest).result;
                    models.forEach((model: any, index: number) => {
                        // Konvertiere JSON zurück zu THREE.js Objekten
                        // und füge sie zum Cache hinzu
                        // this.modelCache.set(paths[index], model);
                    });
                };

                // Lade Texturen
                const textureStore = transaction.objectStore('textures');
                textureStore.getAll().onsuccess = (event) => {
                    const textures = (event.target as IDBRequest).result;
                    textures.forEach((texture: any, index: number) => {
                        // Konvertiere JSON zurück zu THREE.js Texturen
                        // und füge sie zum Cache hinzu
                        // this.textureCache.set(paths[index], texture);
                    });
                };

                transaction.oncomplete = () => {
                    console.log('Resources loaded from IndexedDB');
                    resolve();
                };
            };
        });
    }
} 