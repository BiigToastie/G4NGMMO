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
                this.mesh.add(this.model);
                
                // Setze Standardposition und -rotation
                this.model.position.set(0, 0, 0);
                this.model.rotation.set(0, 0, 0);
                
                // Optional: Skaliere das Modell wenn nötig
                this.model.scale.set(1, 1, 1);
                
                // Debug-Info
                console.log('Modell zur Szene hinzugefügt:', {
                    children: this.model.children.length,
                    position: this.model.position,
                    rotation: this.model.rotation,
                    scale: this.model.scale
                });
                
                // Traversiere das Modell um Materialien zu speichern
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        console.log('Gefundenes Mesh:', {
                            name: child.name,
                            material: child.material ? child.material.type : 'kein Material',
                            geometry: child.geometry ? child.geometry.type : 'keine Geometrie'
                        });
                        
                        // Speichere originale Materialien
                        if (child.material) {
                            this.materials.set(child.name, child.material);
                            
                            // Debug Material-Informationen
                            if (child.material instanceof THREE.MeshStandardMaterial) {
                                console.log('Material Details:', {
                                    name: child.name,
                                    color: child.material.color,
                                    map: child.material.map ? 'Textur vorhanden' : 'keine Textur',
                                    normalMap: child.material.normalMap ? 'Normal Map vorhanden' : 'keine Normal Map'
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
        
        // Aktiviere/Deaktiviere verschiedene Haarteile basierend auf dem Style
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

        // Aktiviere/Deaktiviere verschiedene Gesichtsausdrücke
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