import { botEnum } from '../constants/botEnum';

export function linkAccount(username: number, firstName: string) {
    return {
        inline_keyboard: [
            [
                {
                    text: botEnum.linkAccount,
                    callback_data: botEnum.linkAccount
                }
            ]
        ]
    };
}

export function verifyLink(telegramId: string) {
    return {
        inline_keyboard: [
            [
                {
                    text: botEnum.verifyLink,
                    callback_data: botEnum.verifyLink
                }
            ]
        ]
    };
}

export function targetChain() {
    return {
        inline_keyboard: [
            [
                {
                    text: botEnum.backToSniper.key,
                    callback_data: botEnum.backToSniper.value
                }
            ],
            [
                {
                    text: botEnum.bsc.key,
                    callback_data: botEnum.bsc.value
                },
                {
                    text: botEnum.arb.key,
                    callback_data: botEnum.arb.value
                },
                {
                    text: botEnum.avax.key,
                    callback_data: botEnum.avax.value
                }
            ],
            [
                {
                    text: botEnum.eth.key,
                    callback_data: botEnum.eth.value
                },
                {
                    text: botEnum.matic.key,
                    callback_data: botEnum.matic.value
                },
                {
                    text: botEnum.cro.key,
                    callback_data: botEnum.cro.value
                }
            ]
        ]
    };
}
