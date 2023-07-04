import Logging from '../utils/logging';
import { botEnum } from '../constants/botEnum';
import { startMessage } from '../utils/messages.js';
import { linkAccount } from '../utils/inline.markups';
import { createAppUserIfNotExist } from '../service/app.user.service';

module.exports = (bot: any) => {
    bot.start(async (context: any) => {
        Logging.log(`got message from [${context.from}]`);
        // check if user exist, save if not found
        const accountExistsOrCreated = await createAppUserIfNotExist(context.from.id);
        if (accountExistsOrCreated) {
            Logging.info(`checking if already linked`);
        }
        bot.telegram.sendMessage(context.from.id, startMessage, {
            parse_mode: botEnum.PARSE_MODE,
            reply_markup: linkAccount(context.from.id, context.from.first_name)
        });
    });
};
