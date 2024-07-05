import { Logger } from 'winston';
import { winstonLogger } from '@quysterben/jobber-shared';
import { config } from '@auth/config';
import { Sequelize } from 'sequelize';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authServiceDatabaseConnection', 'debug');

export const sequelize: Sequelize = new Sequelize(process.env.MYSQL_DB!, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    multipleStatements: true
  }
});

export async function databaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    log.info('AuthService - Database connection has been established successfully.');
  } catch (error) {
    log.error(`AuthService - Error connecting to database: ${error}`);
    log.log('error', 'AuthService databaseConnection() error:', error);
  }
}
