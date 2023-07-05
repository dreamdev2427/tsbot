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
*De5i Assister Bot 🔫 *
Type /participant to participate in campaigns for rewards defined by the project ‘s admin.
By proceeding to use the bot, you confirm that you have read and agreed to our [Terms of Service](${process.env.WEBSITE_URL})

`;

export const linkAccountMessage = (username: string, pubkey: string) => {
    return `
*Welcome to ${username} 👋*

Your hot wallet: *${pubkey}*

*/transfer @username Amount*   
e.g /transfer @MB 0.02
You send 0.02ETH to @MB

*/airdrop Amount number_of_people*
e.g /airdrop 3 45 
You send Airdrop 3eth to 45 people, this feature is only for admin

*/showbalance*  
e.g You can see your wallet balance.

*/withdraw 0.002 ethAddress*
e.g /withdraw 0.05 0x2c6873fB1d90319faBD3B4459dxxXFa26e2E3592
You withdraw withdraw 0.05ETH from hot wallet to your address 0x2c6873fB1d90319faBD3B4459dxxXFa26e2E3592

Enjoy! 🚀
`;
};

export const walletAction = `
    Select target blockchain network:
`;
