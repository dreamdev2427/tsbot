import { AppUserModel } from '../models/app.user.model';
import Logging from '../utils/logging';
import * as mongoose from 'mongoose';

// check if app user exist, if not, create new app user
export async function createAppUserIfNotExist(telegramId: string, telegramUsername: string) {
    if (telegramId !== null) {
        AppUserModel.find({
            telegramId: telegramId,
        })
            .then(async (appUsers: any) => {
                if (appUsers != null && appUsers.length > 0) {
                    Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);
                } else {
                    Logging.info(`user [${telegramId}] doesn't exist`);
                    try {
                        await saveNewAppUser(telegramId, telegramUsername);
                        
                    } catch (error: any) {
                        Logging.error(error);
                    }
                }
            })
            .catch((err: any) => {
                Logging.error(err);
            });
        return true;
    }
}

// save new app user function
async function saveNewAppUser(telegramId: string, telgramUsername: string) {
    const appUser = new AppUserModel({
        _id: new mongoose.Types.ObjectId(),
        telegramId: telegramId,
        username: telgramUsername
    });

    return await appUser.save();
}
