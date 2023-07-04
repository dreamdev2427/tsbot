import { AppUserModel } from '../models/app.user.model';
import Logging from '../utils/logging';
import * as mongoose from 'mongoose';

// check if app user exist, if not, create new app user
export async function createAppUserIfNotExist(telegramId: string) {
    if (telegramId !== null) {
        AppUserModel.find({
            telegramId: telegramId
        })
            .then(async (appUsers: any) => {
                if (appUsers != null && appUsers.length > 0) {
                    Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);
                } else {
                    Logging.info(`user [${telegramId}] doesn't exist`);
                    try {
                        await saveNewAppUser(telegramId);
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
async function saveNewAppUser(telegramId: string) {
    const appUser = new AppUserModel({
        _id: new mongoose.Types.ObjectId(),
        telegramId: telegramId
    });

    return await appUser.save();
}
