import * as dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { Telegraf } from 'telegraf';
import path from 'path';
import Logging from './utils/logging.js';
import { connect } from './utils/connect';

dotenv.config();

if (typeof process.env.NODE_ENV == 'string') {
    if (process.env.NODE_ENV.trim() == 'development') {
        Logging.info(`environment [${process.env.NODE_ENV}]`);
        dotenv.config({ path: path.join(__dirname, '..', '.env.development') });
    } else if (process.env.NODE_ENV.trim() == 'production') {
        Logging.info(`environment [${process.env.NODE_ENV}]`);
        dotenv.config({ path: path.join(__dirname, '..', '.env') });
    } else if (process.env.NODE_ENV.trim() == 'staging') {
        Logging.info(`environment [${process.env.NODE_ENV}]`);
        dotenv.config({ path: path.join(__dirname, '..', '.env.staging') });
    }
}

// ========================= Express Server =============================

const app: Express = express();

app.use(express.json());
app.use('/api', require('./routes/app.routes'));

app.get('/api', (request: Request, response: Response) => {
    response.send('Health check');
});

app.listen(process.env.PORT, async function () {
    Logging.log(`Ready to go. listening on port ${process.env.PORT}`);
    await connect();
});

// ========================= Telegraf Bot =============================
const bot = new Telegraf(process.env.TELEGRAM_API_KEY);

// ------------- commands --------------
//start command
const startCommand = require('./commands/start');
startCommand(bot);

// snipe command
const snipeCommand = require('./commands/snipe');
snipeCommand(bot);

// ------------- actions --------------
const linkAccountAction = require('./commands/actions/link.account.action');
linkAccountAction(bot);

const selectChainAction = require('./commands/actions/select.chain.action');
selectChainAction(bot);

const backToSnipeAction = require('./commands/actions/back.to.snipe.action');
backToSnipeAction(bot);

bot.launch();
