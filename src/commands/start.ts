import Logging from '../utils/logging';
import { botEnum } from '../constants/botEnum';
import { linkAccountMessage, startMessage } from '../utils/messages.js';
import { linkAccount } from '../utils/inline.markups';
import { createAppUserIfNotExist } from '../service/app.user.service';
import { message } from 'telegraf/filters';
import { BOT_STATUS } from '../status';
import Web3 from 'web3';
import { AppUserModel } from '../models/app.user.model';
import DISTRIBUTER_JSON from '../utils/distributeEther';

const web3 = new Web3(`https://rpc.ankr.com/eth_goerli`);
const blockscanSite = 'https://goerli.etherscan.io';
// const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_ID}`);
//rpc.ankr.com/eth_goerli

module.exports = (bot: any) => {
    bot.start(async (context: any) => {
        try {
            const chatId = context.chat.id;
            Logging.log(`got message from [${JSON.stringify(context.from, null, 2)}]`);
            // check if user exist, save if not found

            const accountExistsOrCreated = await createAppUserIfNotExist(context.from.id, context.from.username);
            if (accountExistsOrCreated) {
                Logging.info(`checking if already linked`);
            }
            bot.telegram.sendMessage(chatId, startMessage, {
                parse_mode: botEnum.PARSE_MODE,
                reply_markup: linkAccount(context.from.id, context.from.first_name)
            });
        } catch (error) {
            Logging.warn(error);
        }
    });

    bot.on(message('text'), async (ctx: any) => {
        const telegramId = ctx.from.id;
        const chatId = ctx.chat.id;
        const textStr = ctx.message.text;
        Logging.info(`telegramId >>>> ${telegramId} chatId >>>> ${chatId} textStr >>>> ${textStr}`);
        try {
            const patternTransfer = new RegExp(/^\/transfer\s+@\w+\s+\d+(\.\d+)?$/);
            const patternAirdrop = new RegExp(/^\/airdrop\s+(\d+(\.\d+)?)\s+\d+$/);
            const patternBalance = new RegExp(/^\/showbalance\s*$/);
            const patternWithdraw = new RegExp(/^\/withdraw\s+(\d+(\.\d+)?)\s+0x[a-fA-F0-9]{40}$/);
            const patternCommands = new RegExp(/^\/home\s*$/);
            const patternStart = new RegExp(/^\/de5i\s*$/);

            if (patternStart.test(textStr) === true) {
                try {
                    Logging.log(`got message from [${JSON.stringify(ctx.from, null, 2)}]`);
                    // check if user exist, save if not found

                    const accountExistsOrCreated = await createAppUserIfNotExist(ctx.from.id, ctx.from.username);
                    if (accountExistsOrCreated) {
                        Logging.info(`checking if already linked`);
                    }
                    bot.telegram.sendMessage(chatId, startMessage, {
                        parse_mode: botEnum.PARSE_MODE,
                        reply_markup: linkAccount(ctx.from.id, ctx.from.first_name)
                    });
                } catch (error) {
                    Logging.warn(error);
                }
            }
            if (patternCommands.test(textStr) === true) {
                try {
                    const appUsers = await AppUserModel.find({
                        telegramId: telegramId
                    });
                    if (appUsers != null && appUsers.length > 0) {
                        Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);
                        //if user has no keys
                        if (appUsers[0].pubkey === '') {
                            bot.telegram.sendMessage(chatId, startMessage, {
                                parse_mode: botEnum.PARSE_MODE,
                                reply_markup: linkAccount(telegramId, ctx.from.first_name)
                            });
                        } else {
                            bot.telegram.sendMessage(chatId, linkAccountMessage(ctx.from.username, appUsers[0].pubkey), {
                                parse_mode: botEnum.PARSE_MODE
                            });
                        }
                    }
                } catch (error) {
                    Logging.error(error);
                }
            }
            if (patternTransfer.test(textStr) === true) {
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
                                            bot.telegram.sendMessage(chatId, `Transfering ${amount} ETH to ${receiverAddress}. ${blockscanSite}/tx/${hash}`, {
                                                parse_mode: botEnum.PARSE_MODE
                                            });
                                        })
                                        .on('receipt', function (receipt: any) {
                                            if (receipt?.status) {
                                                bot.telegram.sendMessage(chatId, `Succeed in transfering ${amount} ETH to ${receiverAddress}.`, {
                                                    parse_mode: botEnum.PARSE_MODE
                                                });
                                            } else {
                                                bot.telegram.sendMessage(chatId, `Failt in transfering ${amount} ETH to ${receiverAddress}. `, {
                                                    parse_mode: botEnum.PARSE_MODE
                                                });
                                            }
                                        });
                                } else {
                                    //recommend to user to let receiver participcate in this bot
                                    bot.telegram.sendMessage(chatId, `The receiver ${receiverUsername} is not registered to me. Please let him(her) to participate and try again.`, {
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
                        const appUsers = await AppUserModel.find({
                            telegramId: telegramId
                        });

                        if (appUsers != null && appUsers.length > 0) {
                            Logging.info(`user found [${appUsers[0]}] length [${appUsers.length}]`);

                            const number2Devide = Math.floor(numberOfPeople);
                            const result = await AppUserModel.aggregate([{ $sample: { size: number2Devide } }]);

                            const pubkeys = result.map((user) => user.pubkey);
                            const usernames = result.map((user) => user.username);
                            const senderAddress = appUsers[0].pubkey;
                            const senderUsername = appUsers[0].username;
                            const senderPrivateKey = appUsers[0].prkey;
                            const receiverAddress = process.env.DISTRIBUTER;
                            const filterMyKey = pubkeys.filter((item) => item.toString().toLowerCase() !== senderAddress.toString().toLowerCase());
                            const filterMyUsername = usernames.filter((item) => item.toString() !== senderUsername.toString());
                            Logging.log(`addresses >>  ${JSON.stringify(pubkeys, null, 2)}`);
                            Logging.log(`Usernames along addresses >>  ${JSON.stringify(filterMyUsername, null, 2)}`);
                            if (filterMyKey.length < number2Devide) {
                                console.log(`Requested ${number2Devide} wallets, but only found ${filterMyKey.length}`);
                                bot.telegram.sendMessage(chatId, `Requested ${number2Devide} users, but only found ${filterMyKey.length}`, {
                                    parse_mode: botEnum.PARSE_MODE
                                });
                            }
                            bot.telegram.sendMessage(
                                chatId,
                                `These are selected wallets. 
                              ${JSON.stringify(filterMyKey, null, 2)}
                              \n
                              These are selected usernames paried with upper addresses. 
                              ${JSON.stringify(filterMyUsername, null, 2)}
                              Now distributing ${amount} ETH ...`,
                                {
                                    parse_mode: botEnum.PARSE_MODE
                                }
                            );
                            const distributerContract: any = new web3.eth.Contract(DISTRIBUTER_JSON, receiverAddress);
                            const doDistribute = distributerContract.methods.distribute(filterMyKey);
                            const currentGasPrice = await web3.eth.getGasPrice();
                            Logging.log(`currentGasPrice >>> ${currentGasPrice.toString()}`);
                            const nonce = await web3.eth.getTransactionCount(senderAddress, 'pending');
                            Logging.log(`nonce >>> ${nonce.toString()}`);
                            const hexNonce = web3.utils.toHex(nonce);
                            Logging.log(`hexNonce >>> ${hexNonce.toString()}`);
                            const encodedABI = doDistribute.encodeABI();
                            const gasFee = await doDistribute.estimateGas({
                                from: senderAddress
                            });
                            const transaction = {
                                nonce: hexNonce,
                                from: senderAddress,
                                to: receiverAddress,
                                value: web3.utils.toWei(amount.toString(), 'ether').toString(),
                                data: encodedABI,
                                gasPrice: currentGasPrice.toString(),
                                gasLimit: web3.utils.toHex(300000) // This is the standard gas limit for a simple transfer. If your transaction involves contract interaction, you may need to increase this.
                            };
                            Logging.log(`transaction >>> ${JSON.stringify(transaction, null, 2)}`);
                            const signedTx = await web3.eth.accounts.signTransaction(transaction, senderPrivateKey);
                            let txhash = '';
                            await web3.eth
                                .sendSignedTransaction(signedTx.rawTransaction)
                                .on('transactionHash', function (hash: any) {
                                    txhash = hash;
                                    bot.telegram.sendMessage(chatId, `Airdroping ${amount} ETH to ${receiverAddress}. ${blockscanSite}/tx/${hash}`, {
                                        parse_mode: botEnum.PARSE_MODE
                                    });
                                })
                                .on('receipt', function (receipt: any) {
                                    if (receipt?.status) {
                                        bot.telegram.sendMessage(chatId, `Succeed in airdroping ${amount} ETH to ${receiverAddress}.`, {
                                            parse_mode: botEnum.PARSE_MODE
                                        });
                                    } else {
                                        bot.telegram.sendMessage(chatId, `Failt in airdroping ${amount} ETH to ${receiverAddress}.`, {
                                            parse_mode: botEnum.PARSE_MODE
                                        });
                                    }
                                });
                        }
                    }
                } catch (error) {
                    Logging.error(error);
                    bot.telegram.sendMessage(chatId, `Failt in airdropping ${amount} ETH to ${numberOfPeople} users. ${error?.message || ''}`, {
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
                            bot.telegram.sendMessage(chatId, `You have ${Number(balanceEth).toFixed(3)} ETH.`, {
                                parse_mode: botEnum.PARSE_MODE
                            });
                        }
                    } catch (error) {
                        console.error(`An error occurred: ${error}`);
                        bot.telegram.sendMessage(chatId, `Failt in reading balance. ${error?.message || ''}`, {
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
                                        bot.telegram.sendMessage(chatId, `Withdrawing ${amount} ETH to ${receiverAddress}. ${blockscanSite}/tx/${hash}`, {
                                            parse_mode: botEnum.PARSE_MODE
                                        });
                                    })
                                    .on('receipt', function (receipt: any) {
                                        if (receipt?.status) {
                                            bot.telegram.sendMessage(chatId, `Succeed in withdrawing ${amount} ETH to ${receiverAddress}. `, {
                                                parse_mode: botEnum.PARSE_MODE
                                            });
                                        } else {
                                            bot.telegram.sendMessage(chatId, `Failt in withdrawing ${amount} ETH to ${receiverAddress}.`, {
                                                parse_mode: botEnum.PARSE_MODE
                                            });
                                        }
                                    });
                            }
                        } else {
                            Logging.info(`User ${telegramId} doesn't exist`);
                        }
                    } catch (err: any) {
                        Logging.error(err);
                        bot.telegram.sendMessage(chatId, `Failt in withdrawing ${amount} ETH to ${receiverAddress}. ${err?.message || ''}`, {
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
