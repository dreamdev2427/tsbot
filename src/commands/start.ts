import Logging from '../utils/logging';
import { botEnum } from '../constants/botEnum';
import { startMessage } from '../utils/messages.js';
import { linkAccount } from '../utils/inline.markups';
import { createAppUserIfNotExist } from '../service/app.user.service';
import { message } from 'telegraf/filters';
import { BOT_STATUS, GLOBAL_BOT_STATUS } from '../status';

module.exports = (bot: any) => {
  
    bot.start(async (context: any) => {
        Logging.log(`got message from [${JSON.stringify(context.from, null, 2)}]`);
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
      bot.on(message('text'), async (ctx: any) => {
        const telegramId = ctx.from.id
        const textStr = ctx.message.text;
          console.log("telegramId >>>> ", telegramId, " , textStr >>>> ", textStr);
        if(GLOBAL_BOT_STATUS[telegramId] === BOT_STATUS.STATUS_WAITING_TRANSFER_PARAMS)
        {
            const patt = new RegExp(/\/transfer (.+)/);
            if (patt.test(textStr) === true) {
                const [command, username, amount] = textStr.splite('\\s+');
                //do web3 transfer operation
            } else {
                console.log("invalid text");
            }
        }
        if(GLOBAL_BOT_STATUS[telegramId] === BOT_STATUS.STATUS_WATING_AIRDROP_PARAMS)
        {
            const patt = new RegExp(/\/airdrop (.+)/);
            if (patt.test(textStr) === true) {
                const [command, amount, numberOfPeople] = textStr.splite('\\s+');
                //do web3 airdrop operation
            } else {
                console.log("invalid text", );
            }
        }
          if (GLOBAL_BOT_STATUS[telegramId] !== BOT_STATUS.STATUS_BEFORE_PARTICIPATE) {
              const patt = new RegExp(/\/balance (.+)/);
              if (patt.test(textStr) === true) {
                  //read balance from user wallet
              }else {
                console.log("invalid text", );
            }
          }
            if(GLOBAL_BOT_STATUS[telegramId] === BOT_STATUS.STATUS_WAITING_WITHDRAW_PARAMS)
        {
            const patt = new RegExp(/\/withdraw (.+)/);
            if (patt.test(textStr) === true) {
                const [command, amount, ethAddress] = textStr.splite('\\s+');
                //do web3 airdrop operation
            } else {
                console.log("invalid text", );
            }
        }
    })
};
