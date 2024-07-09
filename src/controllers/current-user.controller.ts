import crypto from 'crypto';

import { getAuthUserById, getAuthUserByUsernameOrEmail, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@quysterben/jobber-shared';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';

export async function readCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let user = null;
    const existingUser: IAuthDocument | undefined = await getAuthUserById(req.currentUser!.id);
    if (Object.keys(existingUser!).length) {
      user = existingUser;
    }
    res.status(StatusCodes.OK).json({ message: 'Authenticated user.', user });
  } catch (error) {
    next(error);
  }
}

export async function resendEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, userId } = req.body;
    const checkIfUserExists: IAuthDocument | undefined = await getAuthUserByUsernameOrEmail(email);
    if (!checkIfUserExists) {
      throw new BadRequestError('Email is invalid.', 'CurrentUser resendEmail() method error');
    }
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const verifyLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;
    await updateVerifyEmailField(parseInt(userId), 0, randomCharacters);
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: email,
      verifyLink,
      template: 'verifyEmail'
    };
    await publishDirectMessage(
      authChannel,
      'email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Buyer details sent to buyer service.'
    );
    const updatedUser: IAuthDocument | undefined = await getAuthUserById(parseInt(userId));
    res.status(StatusCodes.OK).json({ message: 'Email verification sent', user: updatedUser });
  } catch (error) {
    next(error);
  }
}
