import { BaseCharacter } from './BaseCharacter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class FemaleCharacter extends BaseCharacter {
    constructor(loader: GLTFLoader) {
        super(loader);
        this.loadModel('/models/female_all/Animation_Mirror_Viewing_withSkin.glb');
    }

    protected setupModel(): void {
        super.setupModel();
        if (this.model) {
            // Spezifische Anpassungen für weibliche Charaktere
            this.model.rotation.y = Math.PI; // Drehe um 180 Grad
            this.model.scale.set(1.0, 1.0, 1.0); // Normale Größe
        }
    }
} 