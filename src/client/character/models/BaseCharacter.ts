import { 
    Object3D,
    Mesh,
    Material,
    MeshStandardMaterial,
    Group,
    AnimationMixer,
    AnimationAction,
    Box3,
    Vector3,
    Color
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export abstract class BaseCharacter {
    protected model: Group | null = null;
    protected mixer: AnimationMixer | null = null;
    protected currentAction: AnimationAction | null = null;
    protected materials: Map<string, Material> = new Map();

    constructor(protected readonly loader: GLTFLoader) {}

    public getModel(): Group | null {
        return this.model;
    }

    public isLoaded(): boolean {
        return this.model !== null;
    }

    protected async loadModel(path: string): Promise<void> {
        try {
            const gltf = await this.loadGLTF(path);
            this.model = gltf.scene;
            this.setupModel();
            this.storeMaterials();
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }

    private async loadGLTF(path: string): Promise<GLTF> {
        return new Promise((resolve, reject) => {
            this.loader.load(path, resolve, undefined, reject);
        });
    }

    protected setupModel(): void {
        if (!this.model) return;

        this.model.traverse((child: Object3D) => {
            if (child instanceof Mesh) {
                this.setupMesh(child);
            }
        });

        this.centerModel();
    }

    private storeMaterials(): void {
        if (!this.model) return;

        this.model.traverse((child: Object3D) => {
            if (child instanceof Mesh && child.material) {
                this.materials.set(child.name, child.material);
            }
        });
    }

    protected setupMesh(mesh: Mesh): void {
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
            this.setupMaterial(mesh.material as MeshStandardMaterial);
        }
    }

    protected setupMaterial(material: MeshStandardMaterial): void {
        material.envMapIntensity = 0;
        material.needsUpdate = true;
    }

    protected centerModel(): void {
        if (!this.model) return;

        const box = new Box3().setFromObject(this.model);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());

        this.model.position.x = -center.x;
        this.model.position.y = -center.y + size.y / 2;
        this.model.position.z = -center.z;
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic'): void {
        if (!this.model) return;

        const scale = {
            slim: { x: 0.9, y: 1, z: 0.9 },
            average: { x: 1, y: 1, z: 1 },
            athletic: { x: 1.1, y: 1, z: 1.1 }
        };

        const bodyScale = scale[type];
        this.model.scale.set(bodyScale.x, bodyScale.y, bodyScale.z);
    }

    public setSkinColor(color: Color): void {
        if (!this.model) return;

        this.model.traverse((child: Object3D) => {
            if (child instanceof Mesh && child.material) {
                if (child.name.includes('skin') || child.name.includes('body')) {
                    if (child.material instanceof MeshStandardMaterial) {
                        child.material.color = color;
                    }
                }
            }
        });
    }

    public setHairStyle(style: string): void {
        if (!this.model) return;

        this.model.traverse((child: Object3D) => {
            if (child instanceof Mesh) {
                if (child.name.includes('hair')) {
                    child.visible = child.name.includes(style);
                }
            }
        });
    }

    public setHairColor(color: Color): void {
        if (!this.model) return;

        this.model.traverse((child: Object3D) => {
            if (child instanceof Mesh && child.material) {
                if (child.name.includes('hair')) {
                    if (child.material instanceof MeshStandardMaterial) {
                        child.material.color = color;
                    }
                }
            }
        });
    }

    public update(deltaTime: number): void {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    public dispose(): void {
        if (this.model) {
            this.model.traverse((child: Object3D) => {
                if (child instanceof Mesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat.map) mat.map.dispose();
                                mat.dispose();
                            });
                        } else {
                            if (child.material.map) child.material.map.dispose();
                            child.material.dispose();
                        }
                    }
                }
            });
        }

        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model!);
        }

        this.materials.clear();
    }
} 