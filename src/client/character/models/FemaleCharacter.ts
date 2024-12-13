import { BaseCharacter } from './BaseCharacter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class FemaleCharacter extends BaseCharacter {
    constructor(loader: GLTFLoader) {
        super(loader);
        this.modelPath = '/dist/models/female_all/Animation_Mirror_Viewing_withSkin.glb';
    }
} 