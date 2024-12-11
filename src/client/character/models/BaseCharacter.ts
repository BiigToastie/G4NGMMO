import * as THREE from 'three';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private facialFeatures: Map<string, THREE.Mesh> = new Map();
    private clothingMeshes: Map<string, THREE.Mesh> = new Map();
    private hairMesh: THREE.Group | null = null;
    private gender: 'male' | 'female' = 'male';

    constructor(gender: 'male' | 'female' = 'male') {
        this.mesh = new THREE.Group();
        this.gender = gender;
        this.createBody();
        this.createFacialFeatures();
        this.addDefaultClothing();
    }

    private createBody() {
        // Kopf (größer für Chibi-Stil)
        const headGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const skinMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 1.4;
        this.bodyParts.set('head', head);
        this.mesh.add(head);

        // Torso (geschlechtsspezifisch)
        const torsoGeometry = this.gender === 'male' 
            ? new THREE.BoxGeometry(0.4, 0.5, 0.25) // Breiter für männlich
            : new THREE.BoxGeometry(0.35, 0.45, 0.22); // Schmaler für weiblich
        const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
        torso.position.y = 1.0;
        this.bodyParts.set('torso', torso);
        this.mesh.add(torso);

        // Arme
        this.createArm('left', -0.22);
        this.createArm('right', 0.22);

        // Beine
        this.createLeg('left', -0.1);
        this.createLeg('right', 0.1);
    }

    private createArm(side: 'left' | 'right', xOffset: number) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });

        // Oberarm (kurz für Chibi-Stil)
        const upperArmGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.25, 16);
        const upperArm = new THREE.Mesh(upperArmGeometry, material);
        upperArm.position.set(xOffset, 1.15, 0);
        this.bodyParts.set(`${side}UpperArm`, upperArm);
        this.mesh.add(upperArm);

        // Unterarm
        const forearmGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.25, 16);
        const forearm = new THREE.Mesh(forearmGeometry, material);
        forearm.position.set(xOffset, 0.9, 0);
        this.bodyParts.set(`${side}Forearm`, forearm);
        this.mesh.add(forearm);

        // Hand (rund für Chibi-Stil)
        const handGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const hand = new THREE.Mesh(handGeometry, material);
        hand.position.set(xOffset, 0.75, 0);
        this.bodyParts.set(`${side}Hand`, hand);
        this.mesh.add(hand);
    }

    private createLeg(side: 'left' | 'right', xOffset: number) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });

        // Oberschenkel (kurz für Chibi-Stil)
        const thighGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.3, 16);
        const thigh = new THREE.Mesh(thighGeometry, material);
        thigh.position.set(xOffset, 0.7, 0);
        this.bodyParts.set(`${side}Thigh`, thigh);
        this.mesh.add(thigh);

        // Unterschenkel
        const shinGeometry = new THREE.CylinderGeometry(0.07, 0.09, 0.3, 16);
        const shin = new THREE.Mesh(shinGeometry, material);
        shin.position.set(xOffset, 0.4, 0);
        this.bodyParts.set(`${side}Shin`, shin);
        this.mesh.add(shin);

        // Stiefel
        const bootGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.2);
        const bootMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3019 });
        const boot = new THREE.Mesh(bootGeometry, bootMaterial);
        boot.position.set(xOffset, 0.2, 0.02);
        this.bodyParts.set(`${side}Boot`, boot);
        this.mesh.add(boot);
    }

    private createFacialFeatures() {
        // Große Anime-Augen
        const eyeGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x87CEEB });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.08, 1.45, 0.2);
        this.facialFeatures.set('leftEye', leftEye);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.08, 1.45, 0.2);
        this.facialFeatures.set('rightEye', rightEye);
        this.mesh.add(rightEye);

        // Glanzpunkte in den Augen
        const shineGeometry = new THREE.SphereGeometry(0.015, 16, 16);
        const shineMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

        const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
        leftShine.position.set(0.09, 1.47, 0.24);
        this.facialFeatures.set('leftShine', leftShine);
        this.mesh.add(leftShine);

        const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
        rightShine.position.set(-0.07, 1.47, 0.24);
        this.facialFeatures.set('rightShine', rightShine);
        this.mesh.add(rightShine);

        // Niedlicher Mund
        const mouthGeometry = new THREE.BoxGeometry(0.04, 0.015, 0.01);
        const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xff9999 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.35, 0.24);
        this.facialFeatures.set('mouth', mouth);
        this.mesh.add(mouth);
    }

    private addDefaultClothing() {
        if (this.gender === 'male') {
            // Männliche Kleidung
            const shirtGeometry = new THREE.BoxGeometry(0.42, 0.52, 0.27);
            const shirtMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                flatShading: false
            });
            const shirtMesh = new THREE.Mesh(shirtGeometry, shirtMaterial);
            shirtMesh.position.y = 1.0;
            this.clothingMeshes.set('shirt', shirtMesh);
            this.mesh.add(shirtMesh);

            // Hose
            const pantsGeometry = new THREE.BoxGeometry(0.41, 0.4, 0.26);
            const pantsMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                flatShading: false
            });
            const pantsMesh = new THREE.Mesh(pantsGeometry, pantsMaterial);
            pantsMesh.position.y = 0.6;
            this.clothingMeshes.set('pants', pantsMesh);
            this.mesh.add(pantsMesh);
        } else {
            // Weibliches Kleid/Uniform
            const dressGeometry = new THREE.BoxGeometry(0.37, 0.7, 0.24);
            const dressMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                flatShading: false
            });
            const dressMesh = new THREE.Mesh(dressGeometry, dressMaterial);
            dressMesh.position.y = 0.85;
            this.clothingMeshes.set('dress', dressMesh);
            this.mesh.add(dressMesh);

            // Schleife
            const bowGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.05);
            const bowMaterial = new THREE.MeshPhongMaterial({
                color: 0xff0000,
                flatShading: false
            });
            const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
            bowMesh.position.set(0, 1.2, 0.12);
            this.clothingMeshes.set('bow', bowMesh);
            this.mesh.add(bowMesh);
        }
    }

    public setHairStyle(style: string) {
        if (this.hairMesh) {
            this.mesh.remove(this.hairMesh);
        }

        this.hairMesh = new THREE.Group();
        const hairMaterial = new THREE.MeshPhongMaterial({
            color: this.gender === 'female' ? 0xffb6c1 : 0x4a2f23,
            flatShading: false
        });

        if (this.gender === 'female') {
            // Weibliche Frisuren
            switch (style) {
                case 'long': {
                    // Basis-Haar
                    const baseHair = new THREE.Mesh(
                        new THREE.SphereGeometry(0.27, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
                        hairMaterial
                    );
                    baseHair.position.y = 1.45;
                    this.hairMesh.add(baseHair);

                    // Lange Strähnen
                    const leftStrand = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.05, 0.02, 0.8, 16),
                        hairMaterial
                    );
                    leftStrand.position.set(0.2, 1.1, 0);
                    leftStrand.rotation.z = 0.2;
                    this.hairMesh.add(leftStrand);

                    const rightStrand = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.05, 0.02, 0.8, 16),
                        hairMaterial
                    );
                    rightStrand.position.set(-0.2, 1.1, 0);
                    rightStrand.rotation.z = -0.2;
                    this.hairMesh.add(rightStrand);
                    break;
                }
                default: {
                    // Standard-Frisur
                    const baseHair = new THREE.Mesh(
                        new THREE.SphereGeometry(0.27, 32, 32),
                        hairMaterial
                    );
                    baseHair.position.y = 1.45;
                    this.hairMesh.add(baseHair);
                }
            }
        } else {
            // Männliche Frisuren
            switch (style) {
                case 'spiky': {
                    // Basis-Haar
                    const baseHair = new THREE.Mesh(
                        new THREE.SphereGeometry(0.27, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
                        hairMaterial
                    );
                    baseHair.position.y = 1.45;
                    this.hairMesh.add(baseHair);

                    // Spikes
                    for (let i = 0; i < 8; i++) {
                        const spike = new THREE.Mesh(
                            new THREE.ConeGeometry(0.05, 0.15, 16),
                            hairMaterial
                        );
                        const angle = (i / 8) * Math.PI * 2;
                        spike.position.set(
                            Math.cos(angle) * 0.15,
                            1.6,
                            Math.sin(angle) * 0.15
                        );
                        spike.rotation.x = Math.random() * 0.5 - 0.25;
                        spike.rotation.z = Math.random() * 0.5 - 0.25;
                        this.hairMesh.add(spike);
                    }
                    break;
                }
                default: {
                    // Standard-Frisur
                    const baseHair = new THREE.Mesh(
                        new THREE.SphereGeometry(0.27, 32, 32),
                        hairMaterial
                    );
                    baseHair.position.y = 1.45;
                    this.hairMesh.add(baseHair);
                }
            }
        }

        if (this.hairMesh) {
            this.mesh.add(this.hairMesh);
        }
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        let scale = new THREE.Vector3(1, 1, 1);
        switch (type) {
            case 'slim':
                scale.set(0.9, 1, 0.9);
                break;
            case 'athletic':
                scale.set(1.1, 1, 1.1);
                break;
            default:
                scale.set(1, 1, 1);
        }
        
        this.bodyParts.forEach(part => {
            part.scale.copy(scale);
        });
        
        this.clothingMeshes.forEach(mesh => {
            mesh.scale.copy(scale);
        });
    }

    public setHeight(height: number) {
        const scale = height / 175;
        this.mesh.scale.setY(scale);
    }

    public setSkinColor(color: THREE.Color) {
        this.bodyParts.forEach(part => {
            (part.material as THREE.MeshPhongMaterial).color = color;
        });
        
        const nose = this.facialFeatures.get('nose');
        if (nose) {
            (nose.material as THREE.MeshPhongMaterial).color = color;
        }
    }

    public setEyeColor(color: THREE.Color) {
        const leftEye = this.facialFeatures.get('leftEye');
        const rightEye = this.facialFeatures.get('rightEye');
        if (leftEye) {
            (leftEye.material as THREE.MeshPhongMaterial).color = color;
        }
        if (rightEye) {
            (rightEye.material as THREE.MeshPhongMaterial).color = color;
        }
    }

    public setHairColor(color: THREE.Color) {
        if (this.hairMesh) {
            this.hairMesh.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    (child.material as THREE.MeshPhongMaterial).color = color;
                }
            });
        }
        const leftEyebrow = this.facialFeatures.get('leftEyebrow');
        const rightEyebrow = this.facialFeatures.get('rightEyebrow');
        if (leftEyebrow) {
            (leftEyebrow.material as THREE.MeshPhongMaterial).color = color;
        }
        if (rightEyebrow) {
            (rightEyebrow.material as THREE.MeshPhongMaterial).color = color;
        }
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        const mouth = this.facialFeatures.get('mouth');
        if (!mouth) return;

        switch (expression) {
            case 'happy':
                mouth.scale.set(1, 1.2, 1);
                mouth.position.y = 1.415;
                break;
            case 'sad':
                mouth.scale.set(1, 1.2, 1);
                mouth.position.y = 1.405;
                break;
            default:
                mouth.scale.set(1, 1, 1);
                mouth.position.y = 1.41;
        }
    }

    public setClothing(type: string, color: THREE.Color) {
        const clothingMesh = this.clothingMeshes.get(type);
        if (clothingMesh) {
            (clothingMesh.material as THREE.MeshPhongMaterial).color = color;
        }
    }

    public getMesh(): THREE.Group {
        return this.mesh;
    }
} 