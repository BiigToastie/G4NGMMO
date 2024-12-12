import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureLoader, LoadingManager } from 'three';

interface Resource {
    path: string;
    type: 'model' | 'texture';
    key: string;
}

export class ResourceManager {
    private static instance: ResourceManager;
    private gltfLoader: GLTFLoader;
    private textureLoader: TextureLoader;
    private loadingManager: LoadingManager;
    private resources: Map<string, any> = new Map();
    private resourceQueue: Resource[] = [];
    private isLoading: boolean = false;

    private constructor() {
        this.loadingManager = new LoadingManager();
        this.setupLoadingManager();
        
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.textureLoader = new TextureLoader(this.loadingManager);

        // Füge Standard-Ressourcen hinzu
        this.addToQueue({
            path: '/models/female_all/Animation_Mirror_Viewing_withSkin.glb',
            type: 'model',
            key: 'femaleCharacter'
        });
        this.addToQueue({
            path: '/models/male_all/Animation_Mirror_Viewing_withSkin.glb',
            type: 'model',
            key: 'maleCharacter'
        });
    }

    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    private setupLoadingManager(): void {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Lade... ${Math.round(progress)}% (${itemsLoaded}/${itemsTotal})`);
        };

        this.loadingManager.onLoad = () => {
            console.log('Alle Ressourcen geladen!');
            this.isLoading = false;
        };

        this.loadingManager.onError = (url) => {
            console.error('Fehler beim Laden:', url);
            this.isLoading = false;
        };
    }

    private addToQueue(resource: Resource): void {
        if (!this.resourceQueue.some(r => r.key === resource.key)) {
            this.resourceQueue.push(resource);
        }
    }

    public async preloadAllResources(): Promise<void> {
        if (this.isLoading) {
            console.warn('Ressourcen werden bereits geladen...');
            return;
        }

        this.isLoading = true;
        console.log('Starte Preloading von', this.resourceQueue.length, 'Ressourcen');

        const loadPromises = this.resourceQueue.map(resource => this.loadResource(resource));

        try {
            await Promise.all(loadPromises);
            console.log('Alle Ressourcen erfolgreich vorgeladen!');
        } catch (error) {
            console.error('Fehler beim Vorladen der Ressourcen:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    private loadResource(resource: Resource): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Lade Ressource: ${resource.key} (${resource.type})`);

            switch (resource.type) {
                case 'model':
                    this.gltfLoader.load(
                        resource.path,
                        (gltf) => {
                            this.resources.set(resource.key, gltf);
                            console.log(`Model geladen: ${resource.key}`);
                            resolve();
                        },
                        (progress) => {
                            if (progress.lengthComputable) {
                                const percentComplete = (progress.loaded / progress.total) * 100;
                                console.log(`${resource.key} - ${Math.round(percentComplete)}% geladen`);
                            }
                        },
                        (error: Error) => {
                            console.error(`Fehler beim Laden von ${resource.key}:`, error);
                            reject(error);
                        }
                    );
                    break;

                case 'texture':
                    this.textureLoader.load(
                        resource.path,
                        (texture) => {
                            this.resources.set(resource.key, texture);
                            console.log(`Textur geladen: ${resource.key}`);
                            resolve();
                        },
                        (progress) => {
                            if (progress.lengthComputable) {
                                const percentComplete = (progress.loaded / progress.total) * 100;
                                console.log(`${resource.key} - ${Math.round(percentComplete)}% geladen`);
                            }
                        },
                        (error: Error) => {
                            console.error(`Fehler beim Laden von ${resource.key}:`, error);
                            reject(error);
                        }
                    );
                    break;

                default:
                    reject(new Error(`Unbekannter Ressourcentyp: ${resource.type}`));
            }
        });
    }

    public getResource(key: string): any {
        if (!this.resources.has(key)) {
            console.warn(`Ressource nicht gefunden: ${key}`);
            return null;
        }
        return this.resources.get(key);
    }

    public isResourceLoaded(key: string): boolean {
        return this.resources.has(key);
    }

    public clearResource(key: string): void {
        if (this.resources.has(key)) {
            const resource = this.resources.get(key);
            if (resource && resource.dispose) {
                resource.dispose();
            }
            this.resources.delete(key);
        }
    }

    public clearAllResources(): void {
        this.resources.forEach((resource, key) => {
            if (resource && resource.dispose) {
                resource.dispose();
            }
        });
        this.resources.clear();
        this.resourceQueue = [];
    }
} 