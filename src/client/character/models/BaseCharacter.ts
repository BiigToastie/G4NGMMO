import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private materials: Map<string, THREE.Material> = new Map();
    private gender: 'male' | 'female' = 'male';
    private skinningMaterial: THREE.MeshStandardMaterial;

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        
        // Realistischeres Material mit Subsurface Scattering Effekt
        this.skinningMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.3,
            metalness: 0.0,
            envMapIntensity: 0.5,
        });

        this.createRealisticCharacter();
    }

    private createRealisticCharacter() {
        // Kopf mit realistischen Proportionen
        this.createRealisticHead();
        
        // Torso mit natürlichen Kurven
        this.createRealisticTorso();
        
        // Arme mit Muskelformen
        this.createRealisticArms();
        
        // Beine mit anatomisch korrekten Proportionen
        this.createRealisticLegs();
    }

    private createRealisticHead() {
        // Basis-Kopfform (oval statt rechteckig)
        const headGeometry = new THREE.SphereGeometry(0.12, 32, 32);
        const head = new THREE.Mesh(headGeometry, this.skinningMaterial);
        head.scale.set(0.8, 1, 0.9); // Leicht oval
        head.position.y = 1.6;
        this.mesh.add(head);

        // Gesichtsform
        const faceGeometry = new THREE.SphereGeometry(0.11, 32, 32);
        const face = new THREE.Mesh(faceGeometry, this.skinningMaterial);
        face.scale.set(1.1, 1.3, 0.7);
        face.position.set(0, 1.6, 0.02);
        this.mesh.add(face);

        // Kinn
        const chinGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const chin = new THREE.Mesh(chinGeometry, this.skinningMaterial);
        chin.scale.set(1, 0.7, 0.7);
        chin.position.set(0, 1.48, 0.04);
        this.mesh.add(chin);

        // Hals
        const neckGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 32);
        const neck = new THREE.Mesh(neckGeometry, this.skinningMaterial);
        neck.position.set(0, 1.45, 0);
        this.mesh.add(neck);
    }

    private createRealisticTorso() {
        // Oberkörper mit natürlichen Kurven
        const torsoGeometry = new THREE.CylinderGeometry(
            this.gender === 'male' ? 0.2 : 0.18,  // Oben
            this.gender === 'male' ? 0.22 : 0.2,  // Unten
            0.5,                                  // Höhe
            32,                                   // Segmente
            8,                                    // Höhensegmente
            true                                  // Offen
        );
        const torso = new THREE.Mesh(torsoGeometry, this.skinningMaterial);
        torso.position.set(0, 1.2, 0);
        this.mesh.add(torso);

        // Schultern
        ['left', 'right'].forEach(side => {
            const shoulderGeometry = new THREE.SphereGeometry(0.08, 32, 32);
            const shoulder = new THREE.Mesh(shoulderGeometry, this.skinningMaterial);
            shoulder.position.set(side === 'left' ? -0.2 : 0.2, 1.35, 0);
            this.mesh.add(shoulder);
        });

        // Brustkorb
        const chestGeometry = new THREE.SphereGeometry(0.22, 32, 32);
        const chest = new THREE.Mesh(chestGeometry, this.skinningMaterial);
        chest.scale.set(1, 0.7, 0.6);
        chest.position.set(0, 1.25, 0.02);
        this.mesh.add(chest);

        // Taille
        const waistGeometry = new THREE.CylinderGeometry(0.18, 0.16, 0.2, 32);
        const waist = new THREE.Mesh(waistGeometry, this.skinningMaterial);
        waist.position.set(0, 1.0, 0);
        this.mesh.add(waist);
    }

    private createRealisticArms() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.25 : 0.25;
            
            // Oberarm mit Muskelform
            const upperArmGeometry = new THREE.CylinderGeometry(0.045, 0.04, 0.3, 32);
            const upperArm = new THREE.Mesh(upperArmGeometry, this.skinningMaterial);
            upperArm.position.set(xOffset, 1.3, 0);
            this.mesh.add(upperArm);

            // Ellbogen
            const elbowGeometry = new THREE.SphereGeometry(0.04, 32, 32);
            const elbow = new THREE.Mesh(elbowGeometry, this.skinningMaterial);
            elbow.position.set(xOffset, 1.15, 0);
            this.mesh.add(elbow);

            // Unterarm
            const forearmGeometry = new THREE.CylinderGeometry(0.035, 0.03, 0.25, 32);
            const forearm = new THREE.Mesh(forearmGeometry, this.skinningMaterial);
            forearm.position.set(xOffset, 1.0, 0);
            this.mesh.add(forearm);

            // Handgelenk
            const wristGeometry = new THREE.SphereGeometry(0.03, 32, 32);
            const wrist = new THREE.Mesh(wristGeometry, this.skinningMaterial);
            wrist.position.set(xOffset, 0.85, 0);
            this.mesh.add(wrist);

            // Hand
            const handGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.02);
            const hand = new THREE.Mesh(handGeometry, this.skinningMaterial);
            hand.position.set(xOffset, 0.8, 0.01);
            this.mesh.add(hand);
        });
    }

    private createRealisticLegs() {
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.1 : 0.1;

            // Hüfte
            const hipGeometry = new THREE.SphereGeometry(0.1, 32, 32);
            const hip = new THREE.Mesh(hipGeometry, this.skinningMaterial);
            hip.position.set(xOffset, 0.9, 0);
            this.mesh.add(hip);

            // Oberschenkel
            const thighGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 32);
            const thigh = new THREE.Mesh(thighGeometry, this.skinningMaterial);
            thigh.position.set(xOffset, 0.7, 0);
            this.mesh.add(thigh);

            // Knie
            const kneeGeometry = new THREE.SphereGeometry(0.05, 32, 32);
            const knee = new THREE.Mesh(kneeGeometry, this.skinningMaterial);
            knee.position.set(xOffset, 0.5, 0);
            this.mesh.add(knee);

            // Unterschenkel
            const calfGeometry = new THREE.CylinderGeometry(0.045, 0.035, 0.35, 32);
            const calf = new THREE.Mesh(calfGeometry, this.skinningMaterial);
            calf.position.set(xOffset, 0.3, 0);
            this.mesh.add(calf);

            // Knöchel
            const ankleGeometry = new THREE.SphereGeometry(0.035, 32, 32);
            const ankle = new THREE.Mesh(ankleGeometry, this.skinningMaterial);
            ankle.position.set(xOffset, 0.1, 0);
            this.mesh.add(ankle);

            // Fuß
            const footGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.15);
            const foot = new THREE.Mesh(footGeometry, this.skinningMaterial);
            foot.position.set(xOffset, 0.05, 0.04);
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