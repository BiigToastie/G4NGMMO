import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class BaseCharacter {
    private mesh: THREE.Group;
    private model: THREE.Group | null = null;
    private loader: GLTFLoader;
    private materials: Map<string, THREE.Material> = new Map();
    private gender: 'male' | 'female' = 'male';
    private modelLoaded: boolean = false;

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        this.loader = new GLTFLoader();
        
        // Lade das Modell
        this.loadCharacterModel();
    }

    private async loadCharacterModel() {
        try {
            console.log('Starte Laden des Modells...');
            
            // Setze den Basis-Pfad für Texturen
            this.loader.setPath('/models/');
            
            const gltf = await this.loader.loadAsync('character.gltf');
            this.model = gltf.scene;
            
            console.log('GLTF Datei geladen:', {
                animations: gltf.animations.length,
                scenes: gltf.scenes.length,
                cameras: gltf.cameras.length,
                assets: gltf.asset
            });
            
            // Füge das Modell zur Mesh-Gruppe hinzu
            if (this.model) {
                // Zentriere das Modell
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // Setze das Modell auf den Ursprung
                this.model.position.sub(center);
                
                // Skaliere das Modell auf eine vernünftige Größe
                const scale = 1.0 / size.y; // Normalisiere auf Höhe 1
                this.model.scale.set(scale, scale, scale);
                
                // Füge eine Ambient Light hinzu für bessere Sichtbarkeit
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                this.mesh.add(ambientLight);
                
                // Füge eine Directional Light für Schatten hinzu
                const dirLight = new THREE.DirectionalLight(0xffffff, 1);
                dirLight.position.set(5, 5, 5);
                this.mesh.add(dirLight);

                // Debug: Füge Achsenhelfer hinzu
                const axesHelper = new THREE.AxesHelper(5);
                this.mesh.add(axesHelper);

                // Debug: Füge eine Box um das Modell hinzu
                const boxHelper = new THREE.BoxHelper(this.model, 0xff0000);
                this.mesh.add(boxHelper);

                // Füge das Modell zur Szene hinzu
                this.mesh.add(this.model);
                
                console.log('Modell zur Szene hinzugefügt:', {
                    position: this.model.position.toArray(),
                    rotation: this.model.rotation.toArray(),
                    scale: this.model.scale.toArray(),
                    boundingBox: {
                        min: box.min.toArray(),
                        max: box.max.toArray(),
                        size: size.toArray()
                    }
                });
                
                // Traversiere das Modell um Materialien zu speichern
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        console.log('Gefundenes Mesh:', {
                            name: child.name,
                            material: child.material ? child.material.type : 'kein Material',
                            geometry: child.geometry ? child.geometry.type : 'keine Geometrie',
                            position: child.position.toArray(),
                            visible: child.visible
                        });
                        
                        // Stelle sicher, dass das Mesh sichtbar ist
                        child.visible = true;
                        
                        // Speichere originale Materialien
                        if (child.material) {
                            this.materials.set(child.name, child.material);
                            
                            // Debug Material-Informationen
                            if (child.material instanceof THREE.MeshStandardMaterial) {
                                console.log('Material Details:', {
                                    name: child.name,
                                    color: child.material.color.getHexString(),
                                    map: child.material.map ? 'Textur vorhanden' : 'keine Textur',
                                    normalMap: child.material.normalMap ? 'Normal Map vorhanden' : 'keine Normal Map',
                                    transparent: child.material.transparent,
                                    opacity: child.material.opacity
                                });
                            }
                        }
                    }
                });
                
                this.modelLoaded = true;
                console.log('Modell vollständig geladen und initialisiert');
            }
        } catch (error) {
            console.error('Fehler beim Laden des Charaktermodells:', error);
            if (error instanceof Error) {
                console.error('Details:', {
                    message: error.message,
                    stack: error.stack
                });
            }
        }
    }

    public isLoaded(): boolean {
        return this.modelLoaded;
    }

    public getMesh(): THREE.Group {
        return this.mesh;
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        if (!this.model) return;

        const scale = {
            slim: { x: 0.9, y: 1, z: 0.9 },
            average: { x: 1, y: 1, z: 1 },
            athletic: { x: 1.1, y: 1, z: 1.1 }
        };
        
        const bodyType = scale[type];
        this.model.scale.set(bodyType.x, bodyType.y, bodyType.z);
    }

    public setHeight(height: number) {
        if (!this.model) return;

        const baseHeight = 1.75;
        const scale = height / baseHeight;
        this.model.scale.setY(scale);
    }

    public setSkinColor(color: THREE.Color) {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                if (child.name.includes('skin') || child.name.includes('body')) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.color = color;
                            }
                        });
                    } else if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.color = color;
                    }
                }
            }
        });
    }

    public setEyeColor(color: THREE.Color) {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                if (child.name.includes('eye')) {
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.color = color;
                    }
                }
            }
        });
    }

    public setHairStyle(style: string) {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (child.name.includes('hair')) {
                    child.visible = child.name.includes(style);
                }
            }
        });
    }

    public setHairColor(color: THREE.Color) {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                if (child.name.includes('hair')) {
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.color = color;
                    }
                }
            }
        });
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (child.name.includes('expression')) {
                    child.visible = child.name.includes(expression);
                }
            }
        });
    }

    public setClothing(type: string, color: THREE.Color) {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                if (child.name.includes(type)) {
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.color = color;
                    }
                }
            }
        });
    }
} 