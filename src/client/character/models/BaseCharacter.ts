import { Object3D, AnimationMixer, AnimationAction } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export abstract class BaseCharacter {
    protected model: Object3D | null = null;
    protected mixer: AnimationMixer | null = null;
    protected currentAnimation: AnimationAction | null = null;
    protected loader: GLTFLoader;
    protected modelPath: string = '';

    constructor(loader: GLTFLoader) {
        this.loader = loader;
    }

    public async load(): Promise<Object3D | null> {
        try {
            const gltf: GLTF = await this.loader.loadAsync(this.modelPath);
            this.model = gltf.scene;
            
            // Setup Animation
            if (gltf.animations.length > 0) {
                this.mixer = new AnimationMixer(this.model);
                const idleAnimation = gltf.animations.find(anim => 
                    anim.name.toLowerCase().includes('idle')
                );
                
                if (idleAnimation) {
                    this.currentAnimation = this.mixer.clipAction(idleAnimation);
                    this.currentAnimation.play();
                }
            }

            this.setupModel();
            return this.model;
        } catch (error) {
            console.error('Fehler beim Laden des Charaktermodells:', error);
            return null;
        }
    }

    protected setupModel(): void {
        if (this.model) {
            this.model.traverse((object) => {
                if ('castShadow' in object) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
        }
    }

    public getModel(): Object3D | null {
        return this.model;
    }

    public getMixer(): AnimationMixer | null {
        return this.mixer;
    }

    public dispose(): void {
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model!);
        }
        this.model = null;
        this.mixer = null;
        this.currentAnimation = null;
    }
} 