import Logging from '../../utils/logging';
import { botEnum } from '../../constants/botEnum';
import { linkAccountMessage } from '../../utils/messages';
import { BOT_STATUS } from '../../status';
import Web3 from 'web3';
import { AppUserModel } from '../../models/app.user.model';

module.exports = (bot: any) => {
    bot.action(botEnum.linkAccount, async (context: any) => {
        context.deleteMessage();
        Logging.log(`got message link account from [${JSON.stringify(context.from, null, 2)}]`);
        global.G_BOT_STATUS[context.from.id] = BOT_STATUS.STATUS_ASSINGING_WALLET;
        //generate wallet address
        const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_ID}`); // Use your Infura project ID
        const account = web3.eth.accounts.create();
        //update user record with wallet keys
        await updateUserKeys(context.from.id, account.privateKey, account.address, bot, context.from.username);
        Logging.info(`global.G_BOT_STATUS >>>> ${global.G_BOT_STATUS}`);
        
    });
};


// save new app user function
async function updateUserKeys(telegramId: string, prkey: string, pubkey: string, bot: any, username: string) {
    if (telegramId !== null) {
        AppUserModel.find({
            telegramId: telegramId,
        })
            .then(async (appUsers: any) => {
                if (appUsers != null && appUsers.length > 0) {
                    Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);
                    //if user has no keys
                    if (appUsers[0].pubkey === "") {
                        AppUserModel.findByIdAndUpdate(appUsers[0]._id, {
                            pubkey: pubkey,
                            prkey: prkey
                        }).then(response => {
                            global.G_BOT_STATUS[telegramId] = BOT_STATUS.STATUS_READY;
                            bot.telegram.sendMessage(telegramId, linkAccountMessage(username, pubkey), {
                                parse_mode: botEnum.PARSE_MODE
                            });
                        }).catch(error => {
                            global.G_BOT_STATUS[telegramId] = BOT_STATUS.STATUS_FAILT_ASSIGING_WALLET;
                            console.log(JSON.stringify(error?.message, null, 2));
                        })
                    } else {
                        bot.telegram.sendMessage(telegramId, linkAccountMessage(username, appUsers[0].pubkey), {
            parse_mode: botEnum.PARSE_MODE
        });
                    }
                } else {
                    Logging.info(`user [${telegramId}] doesn't exist`);
                    try {
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
