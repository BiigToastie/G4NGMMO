import { Schema, model, Document } from 'mongoose';

export interface ICharacter extends Document {
    userId: string;
    name: string;
    class: 'warrior' | 'mage' | 'ranger' | 'rogue';
    gender: 'male' | 'female';
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    createdAt: Date;
    lastLogin: Date;
}

const CharacterSchema = new Schema<ICharacter>({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    class: { 
        type: String, 
        required: true,
        enum: ['warrior', 'mage', 'ranger', 'rogue']
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female']
    },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
    },
    rotation: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

export const Character = model<ICharacter>('Character', CharacterSchema); 