import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private materials: Map<string, THREE.Material> = new Map();
    private gender: 'male' | 'female' = 'male';

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        
        // Basis-Material für den Körper - exakte Farbe wie im Original
        this.materials.set('body', new THREE.MeshToonMaterial({
            color: 0xF4D03F, // Gelb wie im Original
            emissive: 0x000000,
            gradientMap: this.createToonGradient()
        }));

        // Material für die Augen - tiefschwarz wie im Original
        this.materials.set('eyes', new THREE.MeshBasicMaterial({
            color: 0x000000
        }));

        // Material für den Mund - tiefschwarz wie im Original
        this.materials.set('mouth', new THREE.MeshBasicMaterial({
            color: 0x000000
        }));

        this.createCharacter();
    }

    private createToonGradient(): THREE.Texture {
        const gradientMap = new THREE.DataTexture(
            new Uint8Array([0, 128, 255]),
            3,
            1,
            THREE.LuminanceFormat
        );
        gradientMap.needsUpdate = true;
        return gradientMap;
    }

    private createCharacter() {
        this.createHead();
        this.createBody();
        this.createArms();
        this.createLegs();
    }

    private createHead() {
        // Kopf - exakte Form wie im Original
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.7);
        const head = new THREE.Mesh(headGeometry, this.materials.get('body'));
        head.position.y = 1.9;
        this.mesh.add(head);

        // Augen - große ovale Formen wie im Original
        ['left', 'right'].forEach(side => {
            const eyeGeometry = new THREE.BoxGeometry(0.2, 0.25, 0.1);
            const eye = new THREE.Mesh(eyeGeometry, this.materials.get('eyes'));
            eye.position.set(side === 'left' ? -0.2 : 0.2, 1.95, 0.36);
            this.mesh.add(eye);

            // Weiße Glanzpunkte wie im Original
            const highlightGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.01);
            const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
            highlight.position.set(
                side === 'left' ? -0.17 : 0.23,
                2.0,
                0.42
            );
            this.mesh.add(highlight);
        });

        // Mund - einfache schwarze Linie wie im Original
        const mouthGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.1);
        const mouth = new THREE.Mesh(mouthGeometry, this.materials.get('mouth'));
        mouth.position.set(0, 1.75, 0.36);
        this.mesh.add(mouth);
    }

    private createBody() {
        // Torso - exakte Form wie im Original
        const torsoGeometry = new THREE.BoxGeometry(1.0, 0.9, 0.6);
        const torso = new THREE.Mesh(torsoGeometry, this.materials.get('body'));
        torso.position.y = 1.2;
        this.mesh.add(torso);

        // Hals - verbindet Kopf und Körper
        const neckGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        const neck = new THREE.Mesh(neckGeometry, this.materials.get('body'));
        neck.position.y = 1.65;
        this.mesh.add(neck);
    }

    private createArms() {
        ['left', 'right'].forEach(side => {
            // Schultern - wie im Original
            const shoulderGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const shoulder = new THREE.Mesh(shoulderGeometry, this.materials.get('body'));
            shoulder.position.set(side === 'left' ? -0.65 : 0.65, 1.4, 0);
            this.mesh.add(shoulder);

            // Oberarm - exakte Form
            const upperArmGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
            const upperArm = new THREE.Mesh(upperArmGeometry, this.materials.get('body'));
            upperArm.position.set(side === 'left' ? -0.65 : 0.65, 1.1, 0);
            this.mesh.add(upperArm);

            // Ellbogen - wie im Original
            const elbowGeometry = new THREE.BoxGeometry(0.27, 0.27, 0.27);
            const elbow = new THREE.Mesh(elbowGeometry, this.materials.get('body'));
            elbow.position.set(side === 'left' ? -0.65 : 0.65, 0.8, 0);
            this.mesh.add(elbow);

            // Unterarm
            const lowerArmGeometry = new THREE.BoxGeometry(0.25, 0.5, 0.25);
            const lowerArm = new THREE.Mesh(lowerArmGeometry, this.materials.get('body'));
            lowerArm.position.set(side === 'left' ? -0.65 : 0.65, 0.5, 0);
            this.mesh.add(lowerArm);

            // Hand - exakte Form
            const handGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            const hand = new THREE.Mesh(handGeometry, this.materials.get('body'));
            hand.position.set(side === 'left' ? -0.65 : 0.65, 0.2, 0);
            this.mesh.add(hand);
        });
    }

    private createLegs() {
        ['left', 'right'].forEach(side => {
            // Hüfte - wie im Original
            const hipGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const hip = new THREE.Mesh(hipGeometry, this.materials.get('body'));
            hip.position.set(side === 'left' ? -0.25 : 0.25, 0.8, 0);
            this.mesh.add(hip);

            // Oberschenkel - exakte Form
            const thighGeometry = new THREE.BoxGeometry(0.25, 0.5, 0.25);
            const thigh = new THREE.Mesh(thighGeometry, this.materials.get('body'));
            thigh.position.set(side === 'left' ? -0.25 : 0.25, 0.5, 0);
            this.mesh.add(thigh);

            // Knie - wie im Original
            const kneeGeometry = new THREE.BoxGeometry(0.27, 0.27, 0.27);
            const knee = new THREE.Mesh(kneeGeometry, this.materials.get('body'));
            knee.position.set(side === 'left' ? -0.25 : 0.25, 0.25, 0);
            this.mesh.add(knee);

            // Unterschenkel
            const calfGeometry = new THREE.BoxGeometry(0.25, 0.4, 0.25);
            const calf = new THREE.Mesh(calfGeometry, this.materials.get('body'));
            calf.position.set(side === 'left' ? -0.25 : 0.25, 0.1, 0);
            this.mesh.add(calf);

            // Fuß - exakte Form
            const footGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
            const foot = new THREE.Mesh(footGeometry, this.materials.get('body'));
            foot.position.set(side === 'left' ? -0.25 : 0.25, 0.1, 0.1);
            this.mesh.add(foot);
        });
    }

    public getMesh(): THREE.Group {
        return this.mesh;
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        const scale = {
            slim: { x: 0.9, y: 1, z: 0.9 },
            average: { x: 1, y: 1, z: 1 },
            athletic: { x: 1.1, y: 1, z: 1.1 }
        };
        
        const bodyType = scale[type];
        this.mesh.scale.set(bodyType.x, bodyType.y, bodyType.z);
    }

    public setHeight(height: number) {
        const baseHeight = 1.75;
        const scale = height / baseHeight;
        this.mesh.scale.setY(scale);
    }

    public setSkinColor(color: THREE.Color) {
        const bodyMaterial = this.materials.get('body');
        if (bodyMaterial instanceof THREE.Material) {
            (bodyMaterial as THREE.MeshToonMaterial).color = color;
        }
    }

    public setEyeColor(color: THREE.Color) {
        const eyeMaterial = this.materials.get('eyes');
        if (eyeMaterial instanceof THREE.Material) {
            (eyeMaterial as THREE.MeshBasicMaterial).color = color;
        }
    }

    public setHairStyle(style: string) {
        // Wird später implementiert, wenn Haare benötigt werden
    }

    public setHairColor(color: THREE.Color) {
        // Wird später implementiert, wenn Haare benötigt werden
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        // Wird später implementiert, wenn Gesichtsausdrücke benötigt werden
    }

    public setClothing(type: string, color: THREE.Color) {
        // Wird später implementiert, wenn Kleidung benötigt wird
    }
} 