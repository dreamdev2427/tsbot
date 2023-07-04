import Logging from '../../utils/logging';
import { botEnum } from '../../constants/botEnum';
import { linkAccountMessage } from '../../utils/messages';

module.exports = (bot: any) => {
    bot.action(botEnum.linkAccount, (context: any) => {
        context.deleteMessage();
        Logging.log(`got message link account from [${JSON.stringify(context.from, null, 2)}]`);

        bot.telegram.sendMessage(context.from.id, linkAccountMessage(context.from.id), {
            parse_mode: botEnum.PARSE_MODE
            // reply_markup: verifyLink(context.from.id)
        });
    });
};
