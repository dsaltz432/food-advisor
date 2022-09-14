import mongoose, { ConnectOptions } from 'mongoose';
import { getLogger } from './logger';
import { createUUID } from './utils';

const logger = getLogger('utilities.database');

class Database {
  connected = false;
  mongooseInstance!: typeof mongoose;

  async connect(connect: typeof mongoose['connect']) {
    const MONGO_URL = process.env.MONGO_URL;

    if (!MONGO_URL) {
      throw new Error(`Must define the env variable MONGO_URL`);
    }

    const connectOptions: ConnectOptions = {
      pkFactory: {
        createPk: createUUID,
      },
      retryWrites: true,  
    };

    // don't include username/password for localhost
    if (!MONGO_URL.includes('localhost')) {
      connectOptions.auth = {
        username: process.env.MONGO_USERNAME,
        password: process.env.MONGO_PASSWORD,
      };
    }

    this.mongooseInstance = await connect(MONGO_URL, connectOptions);

    this.connected = true;

    logger.info('Successfully connected to mongo');
  }

  getConnection() {
    if (!this.connected) {
      throw new Error('Unable to getConnection() until the database is connected.');
    }
    return this.mongooseInstance.connection;
  }

  getMongoClient() {
    if (!this.connected) {
      throw new Error('Unable to getMongoClient() until the database is connected.');
    }
    return this.mongooseInstance.connection.getClient();
  }
}

export default Database;
