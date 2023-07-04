import { Schema, model } from 'mongoose';

const appUserSchema = new Schema(
    {
        userId: { type: String, unique: true },
        telegramId: { type: String, unique: true }
    },
    { timestamps: true }
);

export const AppUserModel = model('AppUser', appUserSchema);
