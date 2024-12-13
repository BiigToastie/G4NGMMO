import { BaseCharacter } from './BaseCharacter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class MaleCharacter extends BaseCharacter {
    constructor(loader: GLTFLoader) {
        super(loader);
        this.modelPath = '/dist/models/male_all/Animation_Mirror_Viewing_withSkin.glb';
    }
} 