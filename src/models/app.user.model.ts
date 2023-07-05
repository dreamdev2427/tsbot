import { Schema, model } from 'mongoose';

const appUserSchema = new Schema(
    {
        prkey: { type: String, default: '' },
        pubkey: { type: String, default: '' },
        username: { type: String, default: '' },
        telegramId: { type: String, unique: true }
    },
    { timestamps: true }
);

export const AppUserModel = model('AppUser', appUserSchema);
