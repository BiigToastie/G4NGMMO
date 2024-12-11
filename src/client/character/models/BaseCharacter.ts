import * as THREE from 'three';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyParts: Map<string, THREE.Mesh> = new Map();
    private facialFeatures: Map<string, THREE.Mesh> = new Map();
    private clothingMeshes: Map<string, THREE.Mesh> = new Map();
    private hairMesh: THREE.Group | null = null;

    constructor() {
        this.mesh = new THREE.Group();
        this.createBody();
        this.createFacialFeatures();
        this.addDefaultClothing();
    }

    private createBody() {
        // Torso (realistischere Form)
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.2);
        const torsoMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1.1;
        this.bodyParts.set('torso', torso);
        this.mesh.add(torso);

        // Hüfte
        const hipGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.2);
        const hip = new THREE.Mesh(hipGeometry, torsoMaterial);
        hip.position.y = 0.8;
        this.bodyParts.set('hip', hip);
        this.mesh.add(hip);

        // Kopf (realistischere Form)
        const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
        const head = new THREE.Mesh(headGeometry, torsoMaterial);
        head.position.y = 1.45;
        this.bodyParts.set('head', head);
        this.mesh.add(head);

        // Hals
        const neckGeometry = new THREE.CylinderGeometry(0.05, 0.07, 0.1, 32);
        const neck = new THREE.Mesh(neckGeometry, torsoMaterial);
        neck.position.y = 1.35;
        this.bodyParts.set('neck', neck);
        this.mesh.add(neck);

        // Arme
        this.createArm('left', -0.25);
        this.createArm('right', 0.25);

        // Beine
        this.createLeg('left', -0.1);
        this.createLeg('right', 0.1);
    }

    private createArm(side: 'left' | 'right', xOffset: number) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });

        // Schulter
        const shoulderGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const shoulder = new THREE.Mesh(shoulderGeometry, material);
        shoulder.position.set(xOffset, 1.3, 0);
        this.bodyParts.set(`${side}Shoulder`, shoulder);
        this.mesh.add(shoulder);

        // Oberarm
        const upperArmGeometry = new THREE.CylinderGeometry(0.05, 0.04, 0.3, 16);
        const upperArm = new THREE.Mesh(upperArmGeometry, material);
        upperArm.position.set(xOffset, 1.15, 0);
        this.bodyParts.set(`${side}UpperArm`, upperArm);
        this.mesh.add(upperArm);

        // Ellbogen
        const elbowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const elbow = new THREE.Mesh(elbowGeometry, material);
        elbow.position.set(xOffset, 1.0, 0);
        this.bodyParts.set(`${side}Elbow`, elbow);
        this.mesh.add(elbow);

        // Unterarm
        const forearmGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.3, 16);
        const forearm = new THREE.Mesh(forearmGeometry, material);
        forearm.position.set(xOffset, 0.85, 0);
        this.bodyParts.set(`${side}Forearm`, forearm);
        this.mesh.add(forearm);

        // Hand
        const handGeometry = new THREE.SphereGeometry(0.04, 16, 16);
        const hand = new THREE.Mesh(handGeometry, material);
        hand.position.set(xOffset, 0.7, 0);
        this.bodyParts.set(`${side}Hand`, hand);
        this.mesh.add(hand);
    }

    private createLeg(side: 'left' | 'right', xOffset: number) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });

        // Hüftgelenk
        const hipJointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const hipJoint = new THREE.Mesh(hipJointGeometry, material);
        hipJoint.position.set(xOffset, 0.8, 0);
        this.bodyParts.set(`${side}HipJoint`, hipJoint);
        this.mesh.add(hipJoint);

        // Oberschenkel
        const thighGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 16);
        const thigh = new THREE.Mesh(thighGeometry, material);
        thigh.position.set(xOffset, 0.6, 0);
        this.bodyParts.set(`${side}Thigh`, thigh);
        this.mesh.add(thigh);

        // Knie
        const kneeGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const knee = new THREE.Mesh(kneeGeometry, material);
        knee.position.set(xOffset, 0.4, 0);
        this.bodyParts.set(`${side}Knee`, knee);
        this.mesh.add(knee);

        // Unterschenkel
        const shinGeometry = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 16);
        const shin = new THREE.Mesh(shinGeometry, material);
        shin.position.set(xOffset, 0.2, 0);
        this.bodyParts.set(`${side}Shin`, shin);
        this.mesh.add(shin);

        // Fuß
        const footGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.15);
        const foot = new THREE.Mesh(footGeometry, material);
        foot.position.set(xOffset, 0.025, 0.04);
        this.bodyParts.set(`${side}Foot`, foot);
        this.mesh.add(foot);
    }

    private createFacialFeatures() {
        // Augen
        const eyeGeometry = new THREE.SphereGeometry(0.02, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x634e34 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.04, 1.47, 0.12);
        this.facialFeatures.set('leftEye', leftEye);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.04, 1.47, 0.12);
        this.facialFeatures.set('rightEye', rightEye);
        this.mesh.add(rightEye);

        // Augenbrauen
        const eyebrowGeometry = new THREE.BoxGeometry(0.04, 0.01, 0.01);
        const eyebrowMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2f23 });

        const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        leftEyebrow.position.set(0.04, 1.51, 0.12);
        leftEyebrow.rotation.z = 0.1;
        this.facialFeatures.set('leftEyebrow', leftEyebrow);
        this.mesh.add(leftEyebrow);

        const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        rightEyebrow.position.set(-0.04, 1.51, 0.12);
        rightEyebrow.rotation.z = -0.1;
        this.facialFeatures.set('rightEyebrow', rightEyebrow);
        this.mesh.add(rightEyebrow);

        // Nase
        const noseGeometry = new THREE.ConeGeometry(0.02, 0.04, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, 1.45, 0.15);
        this.facialFeatures.set('nose', nose);
        this.mesh.add(nose);

        // Mund
        const mouthGeometry = new THREE.BoxGeometry(0.06, 0.015, 0.01);
        const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xcc6666 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.41, 0.12);
        this.facialFeatures.set('mouth', mouth);
        this.mesh.add(mouth);
    }

    private addDefaultClothing() {
        // T-Shirt
        const shirtGeometry = new THREE.BoxGeometry(0.42, 0.62, 0.22);
        const shirtMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: false
        });
        const shirtMesh = new THREE.Mesh(shirtGeometry, shirtMaterial);
        shirtMesh.position.y = 1.1;
        this.clothingMeshes.set('shirt', shirtMesh);
        this.mesh.add(shirtMesh);

        // Hose
        const pantsGeometry = new THREE.BoxGeometry(0.37, 0.4, 0.22);
        const pantsMaterial = new THREE.MeshPhongMaterial({
            color: 0x000066,
            flatShading: false
        });
        const pantsMesh = new THREE.Mesh(pantsGeometry, pantsMaterial);
        pantsMesh.position.y = 0.6;
        this.clothingMeshes.set('pants', pantsMesh);
        this.mesh.add(pantsMesh);
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

    public setHairStyle(style: string) {
        // Altes Haar entfernen
        if (this.hairMesh) {
            this.mesh.remove(this.hairMesh);
        }

        this.hairMesh = new THREE.Group();

        const hairMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a2f23,
            flatShading: false
        });

        switch (style) {
            case 'short': {
                // Kurzes Haar mit mehreren Ebenen
                const baseHair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.16, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3),
                    hairMaterial
                );
                baseHair.position.y = 1.5;
                this.hairMesh.add(baseHair);

                // Zusätzliche Haardetails
                const topHair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.14, 32, 32, 0, Math.PI * 2, 0, Math.PI / 4),
                    hairMaterial
                );
                topHair.position.y = 1.52;
                this.hairMesh.add(topHair);
                break;
            }
            case 'medium': {
                // Mittellange Frisur mit Schichten
                const baseHair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.17, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
                    hairMaterial
                );
                baseHair.position.y = 1.48;
                this.hairMesh.add(baseHair);

                // Seitliche Haarpartien
                const sideHairLeft = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.03, 0.2, 32),
                    hairMaterial
                );
                sideHairLeft.position.set(0.15, 1.4, 0);
                sideHairLeft.rotation.z = 0.2;
                this.hairMesh.add(sideHairLeft);

                const sideHairRight = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.03, 0.2, 32),
                    hairMaterial
                );
                sideHairRight.position.set(-0.15, 1.4, 0);
                sideHairRight.rotation.z = -0.2;
                this.hairMesh.add(sideHairRight);
                break;
            }
            case 'long': {
                // Lange Frisur mit fließenden Elementen
                const baseHair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.17, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
                    hairMaterial
                );
                baseHair.position.y = 1.48;
                this.hairMesh.add(baseHair);

                // Lange Haarsträhnen
                const backHair = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.08, 0.5, 32),
                    hairMaterial
                );
                backHair.position.set(0, 1.3, -0.05);
                backHair.rotation.x = 0.2;
                this.hairMesh.add(backHair);

                // Seitliche Strähnen
                const sideHairLeft = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.03, 0.4, 32),
                    hairMaterial
                );
                sideHairLeft.position.set(0.15, 1.3, 0);
                sideHairLeft.rotation.z = 0.1;
                this.hairMesh.add(sideHairLeft);

                const sideHairRight = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.03, 0.4, 32),
                    hairMaterial
                );
                sideHairRight.position.set(-0.15, 1.3, 0);
                sideHairRight.rotation.z = -0.1;
                this.hairMesh.add(sideHairRight);
                break;
            }
        }

        if (this.hairMesh) {
            this.mesh.add(this.hairMesh);
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