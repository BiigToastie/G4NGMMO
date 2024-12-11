import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private materials: Map<string, THREE.Material> = new Map();
    private gender: 'male' | 'female' = 'male';
    private skinningMaterial: THREE.MeshPhysicalMaterial;

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        
        // Fotorealistisches Hautmaterial mit Subsurface Scattering
        this.skinningMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffdbac,
            roughness: 0.3,
            metalness: 0.0,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            sheen: 0.25,
            sheenRoughness: 0.25,
            transmission: 0.2,
            thickness: 0.2,
            envMapIntensity: 1.0
        });

        // Spezielle Materialien für Gesichtsdetails
        this.materials.set('eyes', new THREE.MeshPhysicalMaterial({
            color: 0x4b6584,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            transmission: 0.2,
            thickness: 0.05,
            envMapIntensity: 1.0
        }));

        this.materials.set('mouth', new THREE.MeshPhysicalMaterial({
            color: 0xe66767,
            roughness: 0.2,
            metalness: 0.0,
            clearcoat: 0.5,
            transmission: 0.3,
            thickness: 0.1,
            envMapIntensity: 0.8
        }));

        this.materials.set('teeth', new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1,
            clearcoat: 0.8,
            transmission: 0.1,
            envMapIntensity: 1.0
        }));

        this.createUltraRealisticCharacter();
    }

    private createUltraRealisticCharacter() {
        // Hochdetaillierter Kopf
        this.createDetailedHead();
        
        // Anatomisch korrekter Torso
        this.createAnatomicalTorso();
        
        // Muskulöse Arme mit Gelenken
        this.createDetailedArms();
        
        // Realistische Beine mit Muskeldefinition
        this.createDetailedLegs();
    }

    private createDetailedHead() {
        // Schädelform mit korrekten Proportionen
        const skullGeometry = new THREE.SphereGeometry(0.12, 64, 64);
        const skull = new THREE.Mesh(skullGeometry, this.skinningMaterial);
        skull.scale.set(0.8, 1, 0.9);
        skull.position.y = 1.6;
        this.mesh.add(skull);

        // Gesichtsknochen und -struktur
        const faceGeometry = new THREE.SphereGeometry(0.11, 64, 64);
        const face = new THREE.Mesh(faceGeometry, this.skinningMaterial);
        face.scale.set(1.1, 1.3, 0.7);
        face.position.set(0, 1.6, 0.02);
        this.mesh.add(face);

        // Detaillierte Augen mit Reflexionen
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.035 : 0.035;
            
            // Augenhöhle
            const eyeSocketGeometry = new THREE.SphereGeometry(0.025, 32, 32);
            const eyeSocket = new THREE.Mesh(eyeSocketGeometry, this.skinningMaterial);
            eyeSocket.scale.set(1.2, 1, 0.8);
            eyeSocket.position.set(xOffset, 1.62, 0.07);
            this.mesh.add(eyeSocket);

            // Augapfel mit Glanzeffekt
            const eyeGeometry = new THREE.SphereGeometry(0.012, 32, 32);
            const eye = new THREE.Mesh(eyeGeometry, new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                roughness: 0.1,
                metalness: 0.1,
                clearcoat: 1.0,
                transmission: 0.1,
                thickness: 0.05
            }));
            eye.position.set(xOffset, 1.62, 0.085);
            this.mesh.add(eye);

            // Realistische Iris mit Tiefeneffekt
            const irisGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.002, 32);
            const iris = new THREE.Mesh(irisGeometry, this.materials.get('eyes'));
            iris.rotation.x = Math.PI / 2;
            iris.position.set(xOffset, 1.62, 0.098);
            this.mesh.add(iris);

            // Pupille mit dynamischer Größe
            const pupilGeometry = new THREE.CylinderGeometry(0.004, 0.004, 0.001, 32);
            const pupil = new THREE.Mesh(pupilGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
            pupil.rotation.x = Math.PI / 2;
            pupil.position.set(xOffset, 1.62, 0.099);
            this.mesh.add(pupil);

            // Realistische Augenlider
            const eyelidGeometry = new THREE.SphereGeometry(0.015, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
            const eyelid = new THREE.Mesh(eyelidGeometry, this.skinningMaterial);
            eyelid.position.set(xOffset, 1.625, 0.085);
            eyelid.rotation.x = Math.PI / 2;
            this.mesh.add(eyelid);

            // Wimpern
            const lashGeometry = new THREE.CylinderGeometry(0.0001, 0.0001, 0.005, 8);
            for (let i = 0; i < 20; i++) {
                const lash = new THREE.Mesh(lashGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
                const angle = (i / 20) * Math.PI;
                const radius = 0.015;
                lash.position.set(
                    xOffset + Math.cos(angle) * radius,
                    1.625 + Math.sin(angle) * radius * 0.5,
                    0.09
                );
                lash.rotation.x = Math.PI / 3;
                lash.rotation.z = angle;
                this.mesh.add(lash);
            }
        });

        // Realistische Nase mit Knorpelstruktur
        const noseBaseGeometry = new THREE.SphereGeometry(0.02, 32, 32);
        const noseBase = new THREE.Mesh(noseBaseGeometry, this.skinningMaterial);
        noseBase.scale.set(0.8, 1, 1);
        noseBase.position.set(0, 1.58, 0.1);
        this.mesh.add(noseBase);

        // Nasenrücken
        const noseBridgeGeometry = new THREE.CylinderGeometry(0.01, 0.015, 0.04, 32);
        const noseBridge = new THREE.Mesh(noseBridgeGeometry, this.skinningMaterial);
        noseBridge.rotation.x = Math.PI / 6;
        noseBridge.position.set(0, 1.59, 0.09);
        this.mesh.add(noseBridge);

        // Nasenspitze mit weichen Übergängen
        const noseTipGeometry = new THREE.SphereGeometry(0.015, 32, 32);
        const noseTip = new THREE.Mesh(noseTipGeometry, this.skinningMaterial);
        noseTip.position.set(0, 1.57, 0.12);
        this.mesh.add(noseTip);

        // Detaillierte Nasenlöcher
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.01 : 0.01;
            const nostrilGeometry = new THREE.TorusGeometry(0.006, 0.003, 16, 32);
            const nostril = new THREE.Mesh(nostrilGeometry, new THREE.MeshBasicMaterial({ color: 0x1e1e1e }));
            nostril.rotation.x = Math.PI / 2;
            nostril.position.set(xOffset, 1.56, 0.115);
            this.mesh.add(nostril);
        });

        // Realistischer Mund mit Lippen
        // Oberlippe
        const upperLipGeometry = new THREE.TorusGeometry(0.02, 0.006, 32, 64, Math.PI);
        const upperLip = new THREE.Mesh(upperLipGeometry, this.materials.get('mouth'));
        upperLip.position.set(0, 1.53, 0.1);
        upperLip.rotation.x = -Math.PI / 2;
        this.mesh.add(upperLip);

        // Unterlippe mit Volumen
        const lowerLipGeometry = new THREE.TorusGeometry(0.018, 0.007, 32, 64, Math.PI);
        const lowerLip = new THREE.Mesh(lowerLipGeometry, this.materials.get('mouth'));
        lowerLip.position.set(0, 1.52, 0.095);
        lowerLip.rotation.x = Math.PI / 2;
        this.mesh.add(lowerLip);

        // Mundwinkel
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.02 : 0.02;
            const cornerGeometry = new THREE.SphereGeometry(0.005, 16, 16);
            const corner = new THREE.Mesh(cornerGeometry, this.materials.get('mouth'));
            corner.position.set(xOffset, 1.525, 0.095);
            this.mesh.add(corner);
        });

        // Zähne
        const teethGeometry = new THREE.BoxGeometry(0.035, 0.008, 0.004);
        const upperTeeth = new THREE.Mesh(teethGeometry, this.materials.get('teeth'));
        upperTeeth.position.set(0, 1.528, 0.098);
        this.mesh.add(upperTeeth);

        const lowerTeeth = new THREE.Mesh(teethGeometry, this.materials.get('teeth'));
        lowerTeeth.position.set(0, 1.522, 0.098);
        this.mesh.add(lowerTeeth);

        // Detaillierte Ohren
        ['left', 'right'].forEach(side => {
            const xOffset = side === 'left' ? -0.08 : 0.08;
            
            // Ohrmuschel mit komplexer Form
            const earGeometry = new THREE.SphereGeometry(0.025, 32, 32);
            const ear = new THREE.Mesh(earGeometry, this.skinningMaterial);
            ear.scale.set(0.4, 1, 0.5);
            ear.position.set(xOffset, 1.61, 0);
            this.mesh.add(ear);

            // Ohrläppchen mit weicher Form
            const earLobeGeometry = new THREE.SphereGeometry(0.012, 32, 32);
            const earLobe = new THREE.Mesh(earLobeGeometry, this.skinningMaterial);
            earLobe.position.set(xOffset, 1.58, 0);
            this.mesh.add(earLobe);

            // Komplexes inneres Ohr
            const innerEarGeometry = new THREE.TorusKnotGeometry(0.012, 0.004, 128, 32, 2, 3);
            const innerEar = new THREE.Mesh(innerEarGeometry, this.skinningMaterial);
            innerEar.scale.set(1, 1, 0.2);
            innerEar.position.set(xOffset, 1.61, 0.01);
            innerEar.rotation.y = side === 'left' ? -Math.PI / 2 : Math.PI / 2;
            this.mesh.add(innerEar);

            // Ohrkanal
            const canalGeometry = new THREE.CylinderGeometry(0.004, 0.003, 0.02, 16);
            const canal = new THREE.Mesh(canalGeometry, new THREE.MeshBasicMaterial({ color: 0x1e1e1e }));
            canal.rotation.z = side === 'left' ? -Math.PI / 2 : Math.PI / 2;
            canal.position.set(xOffset + (side === 'left' ? 0.01 : -0.01), 1.61, 0);
            this.mesh.add(canal);
        });

        // Realistisches Kinn
        const chinGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const chin = new THREE.Mesh(chinGeometry, this.skinningMaterial);
        chin.scale.set(1, 0.7, 0.7);
        chin.position.set(0, 1.48, 0.04);
        this.mesh.add(chin);

        // Anatomisch korrekter Hals
        const neckGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 32);
        const neck = new THREE.Mesh(neckGeometry, this.skinningMaterial);
        neck.position.set(0, 1.45, 0);
        this.mesh.add(neck);

        // Adamsapfel (für männliche Charaktere)
        if (this.gender === 'male') {
            const adamsAppleGeometry = new THREE.SphereGeometry(0.015, 32, 32);
            const adamsApple = new THREE.Mesh(adamsAppleGeometry, this.skinningMaterial);
            adamsApple.scale.set(1, 0.5, 0.5);
            adamsApple.position.set(0, 1.43, 0.04);
            this.mesh.add(adamsApple);
        }
    }

    private createAnatomicalTorso() {
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

    private createDetailedArms() {
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

    private createDetailedLegs() {
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