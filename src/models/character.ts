import mongoose, { Schema, Document } from 'mongoose';

export interface ICharacter extends Document {
    userId: string;
    name: string;
    gender: 'male' | 'female';
    height: number;
    build: number;
    skinColor: string;
    face: number;
    hairColor: string;
    hairStyle: number;
    eyes: number;
    eyeColor: string;
    mouth: number;
    createdAt: Date;
    updatedAt: Date;
}

const CharacterSchema: Schema = new Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    height: { type: Number, required: true, min: 150, max: 200 },
    build: { type: Number, required: true, min: 1, max: 100 },
    skinColor: { type: String, required: true },
    face: { type: Number, required: true, min: 1, max: 5 },
    hairColor: { type: String, required: true },
    hairStyle: { type: Number, required: true, min: 1, max: 10 },
    eyes: { type: Number, required: true, min: 1, max: 5 },
    eyeColor: { type: String, required: true },
    mouth: { type: Number, required: true, min: 1, max: 5 }
}, {
    timestamps: true
});

// Index für schnellere Abfragen
CharacterSchema.index({ userId: 1 });

export default mongoose.model<ICharacter>('Character', CharacterSchema); 