import * as dotenv from 'dotenv';
import Logging from './logging';
import path from 'path';
import * as mongoose from 'mongoose';

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

export async function connect() {
    const dbUri = process.env.DB_URI;

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(dbUri /*{ retryWrites: true, w: 'majority', useNewUrlParser: true, useUnifiedTopology: true }*/);
        Logging.info('Connected To Db');
    } catch (error) {
        Logging.error('Could not connect to db');
        Logging.error(error);
        process.exit(1);
    }
}
