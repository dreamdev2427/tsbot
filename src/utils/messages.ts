import * as dotenv from 'dotenv';
import path from 'path';

if (typeof process.env.NODE_ENV == 'string') {
    if (process.env.NODE_ENV.trim() === 'development') {
        dotenv.config({ path: path.join(__dirname, '..', '.env.development') });
    } else if (process.env.NODE_ENV.trim() === 'production') {
        dotenv.config({ path: path.join(__dirname, '..', '.env') });
    } else if (process.env.NODE_ENV.trim() === 'staging') {
        dotenv.config({ path: path.join(__dirname, '..', '.env.staging') });
    }
}

export const startMessage = `
*Swift Trade Bot 🔫 *
deployed by @SwiftTrade. I can snipe call channels, presales and many more to come! Fire /sniper to summon the sniper panel.

By proceeding to use the bot, you confirm that you have read and agreed to our [Terms of Service](${process.env.WEBSITE_URL})

`;

export const linkAccountMessage = (telegramId: string) => {
    return `
🔗 *Link app account*

1. launch IOS/Android/MacOS/Linux app
2. goto settings
3. link account
4. enter code *S-${telegramId}*
`;
};

export const walletAction = `
    Select target blockchain network:
`;
