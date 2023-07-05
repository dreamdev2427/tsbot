import Logging from '../utils/logging';
import { botEnum } from '../constants/botEnum';
import { startMessage } from '../utils/messages.js';
import { linkAccount } from '../utils/inline.markups';
import { createAppUserIfNotExist } from '../service/app.user.service';
import { message } from 'telegraf/filters';
import { BOT_STATUS } from '../status';
import Web3 from 'web3';
import { AppUserModel } from '../models/app.user.model';
import axios from 'axios';

const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_ID}`);

const getCurrentGasPrices = async () => {
    try {
        //this URL is for Ethereum mainnet and Ethereum testnets
        let GAS_STATION = `https://api.debank.com/chain/gas_price_dict_v2?chain=eth`;
        var response = await axios.get(GAS_STATION);
        var prices = {
            low: Math.floor(response.data.data.slow.price),
            medium: Math.floor(response.data.data.normal.price),
            high: Math.floor(response.data.data.fast.price)
        };
        return prices;
    } catch (error) {
        return {
            low: 25000000000,
            medium: 26000000000,
            high: 30000000000
        };
    }
};

module.exports = (bot: any) => {
    bot.start(async (context: any) => {
        try {
            Logging.log(`got message from [${JSON.stringify(context.from, null, 2)}]`);
            // check if user exist, save if not found

            global.G_BOT_STATUS = { ...global.G_BOT_STATUS, [context.from.id]: BOT_STATUS.STATUS_BEFORE_PARTICIPATE };
            const accountExistsOrCreated = await createAppUserIfNotExist(context.from.id, context.from.username);
            if (accountExistsOrCreated) {
                Logging.info(`checking if already linked`);
            }
            bot.telegram.sendMessage(context.from.id, startMessage, {
                parse_mode: botEnum.PARSE_MODE,
                reply_markup: linkAccount(context.from.id, context.from.first_name)
            });
        } catch (error) {
            Logging.warn(error);
        }
    });

    bot.on(message('text'), async (ctx: any) => {
        const telegramId = ctx.from.id;
        const textStr = ctx.message.text;
        Logging.info(`telegramId >>>> ${telegramId}  textStr >>>> ${textStr}`);
        try {
            const patterTransfer = new RegExp(/^\/transfer\s+@\w+\s+\d+(\.\d+)?$/);
            const patternAirdrop = new RegExp(/^\/airdrop\s+(\d+(\.\d+)?)\s+\d+$/);
            const patternBalance = new RegExp(/^\/showbalance\s*$/);
            const patternWithdraw = new RegExp(/^\/withdraw\s+(\d+(\.\d+)?)\s+0x[a-fA-F0-9]{40}$/);

            if (patterTransfer.test(textStr) === true) {
                const [command, receiverUsername, amount] = textStr.split(/\s+/);
                //do web3 transfer operation
                Logging.info(`command >>> ${command}`);
                Logging.info(`username >>> ${receiverUsername}`);
                Logging.info(`amount >>> ${amount}`);
                try {
                    if (telegramId !== null) {
                        const appUsers = await AppUserModel.find({
                            telegramId: telegramId
                        });

                        if (appUsers != null && appUsers.length > 0) {
                            Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);
                            //if user has no keys
                            if (appUsers[0].pubkey === '') {
                                Logging.error(`User ${telegramId} has not prkey!`);
                            } else {
                                const senderPrivateKey = appUsers[0].prkey;
                                const senderAddress = appUsers[0].pubkey;
                                //find receiver by username and read pubkey
                                const candidators = await AppUserModel.find({
                                    username: receiverUsername.replace('@', '')
                                });
                                if (candidators != null && candidators.length > 0) {
                                    const receiverAddress = candidators[0].pubkey; // receiver's public address

                                    const currentGasPrice = await web3.eth.getGasPrice();
                                    Logging.log(`currentGasPrice >>> ${currentGasPrice.toString()}`);
                                    const nonce = await web3.eth.getTransactionCount(senderAddress, 'pending');
                                    Logging.log(`nonce >>> ${nonce.toString()}`);
                                    const hexNonce = web3.utils.toHex(nonce);
                                    Logging.log(`hexNonce >>> ${hexNonce.toString()}`);
                                    const transaction = {
                                        nonce: hexNonce,
                                        from: senderAddress,
                                        to: receiverAddress,
                                        value: web3.utils.toWei(amount.toString(), 'ether').toString(),
                                        gasPrice: currentGasPrice.toString(),
                                        gasLimit: web3.utils.toHex(21000) // This is the standard gas limit for a simple transfer. If your transaction involves contract interaction, you may need to increase this.
                                    };
                                    Logging.log(`transaction >>> ${JSON.stringify(transaction, null, 2)}`);
                                    const signedTx = await web3.eth.accounts.signTransaction(transaction, senderPrivateKey);
                                    let txhash = '';
                                    await web3.eth
                                        .sendSignedTransaction(signedTx.rawTransaction)
                                        .on('transactionHash', function (hash: any) {
                                            txhash = hash;
                                            bot.telegram.sendMessage(
                                                telegramId,
                                                `Withdrawing ${amount} ETH to ${receiverAddress}. 
                                                            https://etherscan.com/tx/${hash}`,
                                                {
                                                    parse_mode: botEnum.PARSE_MODE
                                                }
                                            );
                                        })
                                        .on('receipt', function (receipt: any) {
                                            if (receipt?.status) {
                                                bot.telegram.sendMessage(
                                                    telegramId,
                                                    `Succeed in withdrawing ${amount} ETH to ${receiverAddress}. 
                                                             https://etherscan.com/tx/${txhash}`,
                                                    {
                                                        parse_mode: botEnum.PARSE_MODE
                                                    }
                                                );
                                            } else {
                                                bot.telegram.sendMessage(
                                                    telegramId,
                                                    `Failt in withdrawing ${amount} ETH to ${receiverAddress}.
                                                                 https://etherscan.com/tx/${txhash} `,
                                                    {
                                                        parse_mode: botEnum.PARSE_MODE
                                                    }
                                                );
                                            }
                                        });
                                } else {
                                    //recommend to user to let receiver participcate in this bot
                                    bot.telegram.sendMessage(telegramId, `The receiver ${receiverUsername} is not registered to me. Please let him(her) to participate and try again.`, {
                                        parse_mode: botEnum.PARSE_MODE
                                    });
                                }
                            }
                        } else {
                            Logging.info(`User ${telegramId} doesn't exist`);
                        }
                    }
                } catch (error) {
                    Logging.error(error);
                }
            }
            if (patternAirdrop.test(textStr) === true) {
                const [command, amount, numberOfPeople] = textStr.split(/\s+/);
                //do web3 airdrop operation
                Logging.info(`command >>> ${command}`);
                Logging.info(`amount >>> ${amount}`);
                Logging.info(`numberOfPeople >>> ${numberOfPeople}`);
                try {
                    if (Number(numberOfPeople) >= 1) {
                        const number2Devide = Math.floor(numberOfPeople);
                        const result = await AppUserModel.aggregate([{ $sample: { size: number2Devide } }]);

                        if (result.length < number2Devide) {
                            console.log(`Requested ${number2Devide} wallets, but only found ${result.length}`);
                            bot.telegram.sendMessage(telegramId, `Requested ${number2Devide} users, but only found ${result.length}`, {
                                parse_mode: botEnum.PARSE_MODE
                            });
                        }
                        const pubkeys = result.map((user) => user.pubkey);
                        console.log(pubkeys);
                        bot.telegram.sendMessage(
                            telegramId,
                            `These are selected wallets. 
                              ${JSON.stringify(pubkeys, null, 2)}`,
                            {
                                parse_mode: botEnum.PARSE_MODE
                            }
                        );
                    }
                } catch (error) {
                    Logging.error(error);
                    bot.telegram.sendMessage(telegramId, `Failt in airdropping ${amount} ETH to ${numberOfPeople} users. ${error?.message || ''}`, {
                        parse_mode: botEnum.PARSE_MODE
                    });
                }
            }
            if (patternBalance.test(textStr) === true) {
                //read balance from user wallet
                const [command] = textStr.split(/\s+/);
                Logging.info(`command >>> ${command}`);
                if (telegramId !== null) {
                    try {
                        const appUsers = await AppUserModel.find({
                            telegramId: telegramId
                        });
                        if (appUsers != null && appUsers.length > 0) {
                            const address = appUsers[0].pubkey;
                            const balanceWei = await web3.eth.getBalance(address);
                            const balanceEth = web3.utils.fromWei(balanceWei, 'ether').toString();
                            console.log(`Balance: ${balanceEth} ETH`);
                            bot.telegram.sendMessage(telegramId, `You have ${balanceEth} ETH.`, {
                                parse_mode: botEnum.PARSE_MODE
                            });
                        }
                    } catch (error) {
                        console.error(`An error occurred: ${error}`);
                        bot.telegram.sendMessage(telegramId, `Failt in reading balance. ${error?.message || ''}`, {
                            parse_mode: botEnum.PARSE_MODE
                        });
                    }
                }
            }
            if (patternWithdraw.test(textStr) === true) {
                const [command, amount, receiverAddress] = textStr.split(/\s+/);
                //do web3 airdrop operation
                Logging.info(`command >>> ${command}`);
                Logging.info(`amount >>> ${amount}`);
                Logging.info(`ethAddress >>> ${receiverAddress}`);

                if (telegramId !== null) {
                    try {
                        let appUsers = await AppUserModel.find({
                            telegramId: telegramId
                        });
                        if (appUsers != null && appUsers.length > 0) {
                            Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);
                            //if user has no keys
                            if (appUsers[0].pubkey === '') {
                                Logging.error(`User ${telegramId} has not prkey!`);
                            } else {
                                const senderPrivateKey = appUsers[0].prkey;
                                const senderAddress = appUsers[0].pubkey;
                                //find receiver by username and read pubkey

                                const currentGasPrice = await web3.eth.getGasPrice();
                                Logging.log(`currentGasPrice >>> ${currentGasPrice.toString()}`);
                                const nonce = await web3.eth.getTransactionCount(senderAddress, 'pending');
                                Logging.log(`nonce >>> ${nonce.toString()}`);
                                const hexNonce = web3.utils.toHex(nonce);
                                Logging.log(`hexNonce >>> ${hexNonce.toString()}`);
                                const transaction = {
                                    nonce: hexNonce,
                                    from: senderAddress,
                                    to: receiverAddress,
                                    value: web3.utils.toWei(amount.toString(), 'ether').toString(),
                                    gasPrice: currentGasPrice.toString(),
                                    gasLimit: web3.utils.toHex(21000) // This is the standard gas limit for a simple transfer. If your transaction involves contract interaction, you may need to increase this.
                                };
                                Logging.log(`transaction >>> ${JSON.stringify(transaction, null, 2)}`);
                                const signedTx = await web3.eth.accounts.signTransaction(transaction, senderPrivateKey);
                                let txhash = '';
                                await web3.eth
                                    .sendSignedTransaction(signedTx.rawTransaction)
                                    .on('transactionHash', function (hash: any) {
                                        txhash = hash;
                                        bot.telegram.sendMessage(
                                            telegramId,
                                            `Withdrawing ${amount} ETH to ${receiverAddress}. 
                                                            https://etherscan.com/tx/${hash}`,
                                            {
                                                parse_mode: botEnum.PARSE_MODE
                                            }
                                        );
                                    })
                                    .on('receipt', function (receipt: any) {
                                        if (receipt?.status) {
                                            bot.telegram.sendMessage(
                                                telegramId,
                                                `Succeed in withdrawing ${amount} ETH to ${receiverAddress}. 
                                                             https://etherscan.com/tx/${txhash}`,
                                                {
                                                    parse_mode: botEnum.PARSE_MODE
                                                }
                                            );
                                        } else {
                                            bot.telegram.sendMessage(
                                                telegramId,
                                                `Failt in withdrawing ${amount} ETH to ${receiverAddress}.
                                                                 https://etherscan.com/tx/${txhash} `,
                                                {
                                                    parse_mode: botEnum.PARSE_MODE
                                                }
                                            );
                                        }
                                    });
                            }
                        } else {
                            Logging.info(`User ${telegramId} doesn't exist`);
                        }
                    } catch (err: any) {
                        Logging.error(err);
                        bot.telegram.sendMessage(telegramId, `Failt in withdrawing ${amount} ETH to ${receiverAddress}. ${err?.message || ''}`, {
                            parse_mode: botEnum.PARSE_MODE
                        });
                    }
                }
            }
        } catch (error) {
            Logging.warn(error);
        }
    });
};
