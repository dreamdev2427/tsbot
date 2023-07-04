import { botEnum } from '../constants/botEnum';

module.exports = (bot: any) => {
    bot.command(botEnum.snipe.keys, (ctx: any) => {
        ctx.deleteMessage();
        ctx.telegram.sendMessage(ctx.chat.id, `Explore your options\n\nStart making more money . . .\n\nThe only thing stopping you is *one click*`, {
            reply_markup: {
                inline_keyboard: [
                    [],
                    [{ text: botEnum.menu.key, callback_data: botEnum.menu.value }],
                    [
                        { text: botEnum.wallets.key, callback_data: botEnum.wallets.value },
                        { text: botEnum.call_channel.key, callback_data: botEnum.call_channel.value }
                    ],
                    [
                        { text: botEnum.presales.key, callback_data: botEnum.presales.value },
                        { text: botEnum.copytrade.key, callback_data: botEnum.copytrade.value }
                    ]
                ]
            },
            parse_mode: botEnum.PARSE_MODE
        });
    });
};
