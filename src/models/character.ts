import { Schema, model, Document } from 'mongoose';

export interface ICharacter extends Document {
    userId: number;
    name: string;
    gender: 'male' | 'female';
    height?: number;
    build?: string;
    skinColor?: string;
    face?: string;
    hairColor?: string;
    hairStyle?: string;
    eyes?: string;
    eyeColor?: string;
    mouth?: string;
}

const characterSchema = new Schema<ICharacter>({
    userId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, required: true, enum: ['male', 'female'] },
    height: { type: Number },
    build: { type: String },
    skinColor: { type: String },
    face: { type: String },
    hairColor: { type: String },
    hairStyle: { type: String },
    eyes: { type: String },
    eyeColor: { type: String },
    mouth: { type: String }
}, {
    timestamps: true
});

export const Character = model<ICharacter>('Character', characterSchema); 