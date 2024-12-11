import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private materials: Map<string, THREE.Material> = new Map();
    private skeletonHelper: THREE.SkeletonHelper | null = null;
    private bones: Map<string, THREE.Bone> = new Map();
    private mixer: THREE.AnimationMixer;
    private morphTargets: Map<string, THREE.Mesh> = new Map();
    private gender: 'male' | 'female' = 'male';
    private textureLoader: THREE.TextureLoader;
    private skinningMaterial: THREE.MeshStandardMaterial;

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        this.textureLoader = new THREE.TextureLoader();
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        this.skinningMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.5,
            metalness: 0.05,
            envMapIntensity: 1.0,
        });

        this.createModernCharacter();
    }

    private createModernCharacter() {
        // Kopf mit realistischeren Proportionen
        const head = this.createModernHead();
        head.position.y = 1.6;
        this.mesh.add(head);

        // Moderner Körper
        const body = this.createModernBody();
        body.position.y = 0.8;
        this.mesh.add(body);

        // Moderne Arme
        this.createModernArms();

        // Moderne Beine
        this.createModernLegs();
    }

    private createModernHead(): THREE.Group {
        const headGroup = new THREE.Group();

        // Basis-Kopfform
        const headGeometry = new THREE.SphereGeometry(0.12, 32, 32);
        const head = new THREE.Mesh(headGeometry, this.skinningMaterial);
        headGroup.add(head);

        // Gesichtsform
        const faceGeometry = new THREE.BoxGeometry(0.18, 0.25, 0.15);
        const face = new THREE.Mesh(faceGeometry, this.skinningMaterial);
        face.position.z = 0.02;
        face.position.y = -0.02;
        headGroup.add(face);

        // Kiefer
        const jawGeometry = new THREE.BoxGeometry(0.16, 0.08, 0.12);
        const jaw = new THREE.Mesh(jawGeometry, this.skinningMaterial);
        jaw.position.y = -0.12;
        jaw.position.z = 0.02;
        headGroup.add(jaw);

        return headGroup;
    }

    private createModernBody(): THREE.Group {
        const bodyGroup = new THREE.Group();

        // Torso mit besseren Proportionen
        const torsoGeometry = new THREE.BoxGeometry(
            this.gender === 'male' ? 0.4 : 0.35,
            0.6,
            0.2
        );
        const torso = new THREE.Mesh(torsoGeometry, this.skinningMaterial);
        bodyGroup.add(torso);

        // Schultern
        const shoulderWidth = this.gender === 'male' ? 0.5 : 0.4;
        const shoulderGeometry = new THREE.BoxGeometry(shoulderWidth, 0.1, 0.2);
        const shoulders = new THREE.Mesh(shoulderGeometry, this.skinningMaterial);
        shoulders.position.y = 0.25;
        bodyGroup.add(shoulders);

        // Hüfte
        const hipWidth = this.gender === 'male' ? 0.35 : 0.4;
        const hipGeometry = new THREE.BoxGeometry(hipWidth, 0.15, 0.2);
        const hips = new THREE.Mesh(hipGeometry, this.skinningMaterial);
        hips.position.y = -0.25;
        bodyGroup.add(hips);

        return bodyGroup;
    }

    private createModernArms() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.28 : 0.28;
            
            // Oberarm
            const upperArmGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
            const upperArm = new THREE.Mesh(upperArmGeometry, this.skinningMaterial);
            upperArm.position.set(xOffset, 1.35, 0);
            this.mesh.add(upperArm);

            // Ellbogen
            const elbowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
            const elbow = new THREE.Mesh(elbowGeometry, this.skinningMaterial);
            elbow.position.set(xOffset, 1.2, 0);
            this.mesh.add(elbow);

            // Unterarm
            const forearmGeometry = new THREE.BoxGeometry(0.07, 0.3, 0.07);
            const forearm = new THREE.Mesh(forearmGeometry, this.skinningMaterial);
            forearm.position.set(xOffset, 1.05, 0);
            this.mesh.add(forearm);

            // Hand
            const handGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.04);
            const hand = new THREE.Mesh(handGeometry, this.skinningMaterial);
            hand.position.set(xOffset, 0.85, 0);
            this.mesh.add(hand);
        });
    }

    private createModernLegs() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.12 : 0.12;

            // Oberschenkel
            const thighGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.12);
            const thigh = new THREE.Mesh(thighGeometry, this.skinningMaterial);
            thigh.position.set(xOffset, 0.6, 0);
            this.mesh.add(thigh);

            // Knie
            const kneeGeometry = new THREE.SphereGeometry(0.06, 16, 16);
            const knee = new THREE.Mesh(kneeGeometry, this.skinningMaterial);
            knee.position.set(xOffset, 0.4, 0);
            this.mesh.add(knee);

            // Unterschenkel
            const shinGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
            const shin = new THREE.Mesh(shinGeometry, this.skinningMaterial);
            shin.position.set(xOffset, 0.2, 0);
            this.mesh.add(shin);

            // Fuß
            const footGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.2);
            const foot = new THREE.Mesh(footGeometry, this.skinningMaterial);
            foot.position.set(xOffset, 0.04, 0.05);
            this.mesh.add(foot);
        });
    }

    public getMesh(): THREE.Group {
        return this.mesh;
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        const scale = {
            slim: 0.9,
            average: 1.0,
            athletic: 1.1
        };
        
        this.mesh.scale.set(scale[type], 1, scale[type]);
    }

    public setHeight(height: number) {
        const baseHeight = 1.75; // Basishöhe in Metern
        const scale = height / baseHeight;
        this.mesh.scale.setY(scale);
    }

    public setSkinColor(color: THREE.Color) {
        if (this.skinningMaterial) {
            this.skinningMaterial.color = color;
        }
    }

    public setHairStyle(style: string) {
        // Implementierung der Frisuren folgt später
        console.log(`Frisur ${style} wird gesetzt...`);
    }

    public setHairColor(color: THREE.Color) {
        const hairMaterial = this.materials.get('hair');
        if (hairMaterial instanceof THREE.Material) {
            (hairMaterial as THREE.MeshStandardMaterial).color = color;
        }
    }

    public setEyeColor(color: THREE.Color) {
        const eyeMaterial = this.materials.get('eyes');
        if (eyeMaterial instanceof THREE.Material) {
            (eyeMaterial as THREE.MeshStandardMaterial).color = color;
        }
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        // Implementierung der Gesichtsausdrücke folgt später
        console.log(`Gesichtsausdruck ${expression} wird gesetzt...`);
    }

    public setClothing(type: string, color: THREE.Color) {
        // Implementierung der Kleidung folgt später
        console.log(`Kleidung ${type} wird mit Farbe gesetzt...`);
    }
} 