import { config } from '@auth/config';
import { AuthModel } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { firstLetterUppercase, IAuthBuyerMessageDetails, IAuthDocument, winstonLogger } from '@quysterben/jobber-shared';
import { sign } from 'jsonwebtoken';
import { lowerCase, omit } from 'lodash';
import { Model, Op } from 'sequelize';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authServiceProducer', 'debug');

export async function createAuthUser(data: IAuthDocument): Promise<IAuthDocument | undefined> {
  try {
    const result: Model = await AuthModel.create(data);
    const messageDetail: IAuthBuyerMessageDetails = {
      username: result.dataValues.username!,
      email: result.dataValues.email!,
      profilePicture: result.dataValues.profilePicture!,
      country: result.dataValues.country!,
      createdAt: result.dataValues.createdAt!,
      type: 'auth'
    };
    await publishDirectMessage(
      authChannel,
      'buyer-update',
      'user-buyer',
      JSON.stringify(messageDetail),
      'Buyer detail sent to buyer service queue.'
    );
    const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;
    return userData;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserById(_id: number): Promise<IAuthDocument | undefined> {
  try {
    const user: Model<IAuthDocument> = (await AuthModel.findOne({
      where: { id: _id },
      attributes: { exclude: ['password'] }
    })) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserByUsernameOrEmail(_username?: string, _email?: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model<IAuthDocument> = (await AuthModel.findOne({
      where: {
        [Op.or]: [_username ? { username: firstLetterUppercase(_username) } : {}, _email ? { email: lowerCase(_email) } : {}]
      }
    })) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserByVerificationToken(token: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model<IAuthDocument> = (await AuthModel.findOne({
      where: { emailVerificationToken: token },
      attributes: { exclude: ['password'] }
    })) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserByPasswordToken(token: string): Promise<IAuthDocument | undefined> {
  try {
    const user = (await AuthModel.findOne({
      where: {
        [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
      }
    })) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function updateVerifyEmailField(_id: number, emailVerified: number, emailVerificationToken?: string): Promise<void> {
  try {
    await AuthModel.update(!emailVerificationToken ? { emailVerified } : { emailVerified, emailVerificationToken }, { where: { id: _id } });
  } catch (err) {
    log.error(err);
  }
}

export async function updatePasswordToken(_id: number, token: string, tokenExpiration: Date): Promise<void> {
  try {
    await AuthModel.update({ passwordResetToken: token, passwordResetExpires: tokenExpiration }, { where: { id: _id } });
  } catch (error) {
    log.error(error);
  }
}

export async function updatePassword(_id: number, _password: string): Promise<void> {
  try {
    await AuthModel.update({ password: _password, passwordResetToken: '', passwordResetExpires: new Date() }, { where: { id: _id } });
  } catch (error) {
    log.error(error);
  }
}

export function signToken(id: number, email: string, username: string): string {
  return sign(
    {
      id,
      email,
      username
    },
    config.JWT_TOKEN!
  );
}
