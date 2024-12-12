import { BaseCharacter } from './BaseCharacter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class MaleCharacter extends BaseCharacter {
    constructor(loader: GLTFLoader) {
        super(loader);
        this.loadModel('/models/male_all/Animation_Mirror_Viewing_withSkin.glb');
    }

    protected setupModel(): void {
        super.setupModel();
        if (this.model) {
            // Spezifische Anpassungen für männliche Charaktere
            this.model.rotation.y = Math.PI; // Drehe um 180 Grad
            this.model.scale.set(1.1, 1.1, 1.1); // Etwas größer
        }
    }
} 