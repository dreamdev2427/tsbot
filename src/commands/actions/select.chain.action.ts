import { botEnum } from '../../constants/botEnum';
import { walletAction } from '../../utils/messages';
import { targetChain } from '../../utils/inline.markups';

module.exports = (bot: any) => {
    bot.action(botEnum.wallets.value, (context: any) => {
        context.deleteMessage();

        bot.telegram.sendMessage(context.from.id, walletAction, {
            parse_mode: botEnum.PARSE_MODE,
            reply_markup: targetChain()
        });
    });
};
