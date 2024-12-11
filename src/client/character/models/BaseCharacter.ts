import * as THREE from 'three';

export class BaseCharacter {
    private mesh: THREE.Group;
    private bodyMesh: THREE.Mesh;
    private headMesh: THREE.Mesh;
    private hairMesh: THREE.Mesh | null = null;
    private facialFeatures: Map<string, THREE.Mesh> = new Map();
    private clothingMeshes: Map<string, THREE.Mesh> = new Map();

    constructor() {
        this.mesh = new THREE.Group();
        
        // Basis-Körper erstellen
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false,
            vertexColors: false
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.75;
        this.mesh.add(this.bodyMesh);

        // Kopf erstellen
        const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.y = 1.65;
        this.mesh.add(this.headMesh);

        // Gesichtszüge hinzufügen
        this.createFacialFeatures();

        // Standard-Kleidung hinzufügen
        this.addDefaultClothing();
    }

    private createFacialFeatures() {
        // Augen
        const eyeGeometry = new THREE.SphereGeometry(0.025, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x634e34 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.07, 1.67, 0.15);
        this.facialFeatures.set('leftEye', leftEye);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.07, 1.67, 0.15);
        this.facialFeatures.set('rightEye', rightEye);
        this.mesh.add(rightEye);

        // Augenbrauen
        const eyebrowGeometry = new THREE.BoxGeometry(0.05, 0.01, 0.01);
        const eyebrowMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2f23 });

        const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        leftEyebrow.position.set(0.07, 1.71, 0.15);
        leftEyebrow.rotation.z = 0.1;
        this.facialFeatures.set('leftEyebrow', leftEyebrow);
        this.mesh.add(leftEyebrow);

        const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        rightEyebrow.position.set(-0.07, 1.71, 0.15);
        rightEyebrow.rotation.z = -0.1;
        this.facialFeatures.set('rightEyebrow', rightEyebrow);
        this.mesh.add(rightEyebrow);

        // Mund
        const mouthGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
        const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xcc6666 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.6, 0.15);
        this.facialFeatures.set('mouth', mouth);
        this.mesh.add(mouth);

        // Nase
        const noseGeometry = new THREE.ConeGeometry(0.02, 0.04, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, 1.65, 0.2);
        this.facialFeatures.set('nose', nose);
        this.mesh.add(nose);
    }

    private addDefaultClothing() {
        // T-Shirt
        const shirtGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.6, 32);
        const shirtMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: false
        });
        const shirtMesh = new THREE.Mesh(shirtGeometry, shirtMaterial);
        shirtMesh.position.y = 1.2;
        this.clothingMeshes.set('shirt', shirtMesh);
        this.mesh.add(shirtMesh);

        // Hose
        const pantsGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.9, 32);
        const pantsMaterial = new THREE.MeshPhongMaterial({
            color: 0x000066,
            flatShading: false
        });
        const pantsMesh = new THREE.Mesh(pantsGeometry, pantsMaterial);
        pantsMesh.position.y = 0.45;
        this.clothingMeshes.set('pants', pantsMesh);
        this.mesh.add(pantsMesh);
    }

    public setBodyType(type: 'slim' | 'average' | 'athletic') {
        let scale = new THREE.Vector3(1, 1, 1);
        switch (type) {
            case 'slim':
                scale.set(0.8, 1, 0.8);
                break;
            case 'athletic':
                scale.set(1.1, 1, 1.1);
                break;
            default:
                scale.set(1, 1, 1);
        }
        this.bodyMesh.scale.copy(scale);
        // Kleidung anpassen
        this.clothingMeshes.forEach(mesh => {
            mesh.scale.copy(scale);
        });
    }

    public setHeight(height: number) {
        // Height in cm to scale (175cm is default)
        const scale = height / 175;
        this.mesh.scale.setY(scale);
    }

    public setSkinColor(color: THREE.Color) {
        (this.bodyMesh.material as THREE.MeshPhongMaterial).color = color;
        (this.headMesh.material as THREE.MeshPhongMaterial).color = color;
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
            (this.hairMesh.material as THREE.MeshPhongMaterial).color = color;
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

    public setHairStyle(style: string) {
        // Altes Haar entfernen
        if (this.hairMesh) {
            this.mesh.remove(this.hairMesh);
        }

        // Neues Haar erstellen
        let hairGeometry;
        switch (style) {
            case 'short':
                hairGeometry = new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 4);
                break;
            case 'medium':
                hairGeometry = new THREE.SphereGeometry(0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
                break;
            case 'long':
                hairGeometry = new THREE.CylinderGeometry(0.21, 0.18, 0.4, 32);
                break;
            default:
                return;
        }

        const hairMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a2f23,
            flatShading: false
        });
        this.hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hairMesh.position.y = 1.85;
        this.mesh.add(this.hairMesh);
    }

    public setFacialExpression(expression: 'neutral' | 'happy' | 'sad') {
        const mouth = this.facialFeatures.get('mouth');
        if (!mouth) return;

        switch (expression) {
            case 'happy':
                mouth.scale.set(1, 1.2, 1);
                mouth.position.y = 1.61;
                break;
            case 'sad':
                mouth.scale.set(1, 1.2, 1);
                mouth.position.y = 1.59;
                break;
            default:
                mouth.scale.set(1, 1, 1);
                mouth.position.y = 1.6;
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