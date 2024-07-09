import crypto from 'crypto';

import { changePasswordSchema, emailSchema, passwordSchema } from '@auth/schemes/password';
import { getAuthUserByPasswordToken, getAuthUserByUsernameOrEmail, updatePassword, updatePasswordToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@quysterben/jobber-shared';
import { NextFunction, Request, Response } from 'express';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';
import { AuthModel } from '@auth/models/auth.schema';

export async function createForgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { error } = await Promise.resolve(emailSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Password createForgotPassword() method error');
    }
    const { email } = req.body;
    const existingUser: IAuthDocument | undefined = await getAuthUserByUsernameOrEmail(email);
    if (!existingUser) {
      throw new BadRequestError('User not found.', 'Password createForgotPassword() method error');
    }
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const date: Date = new Date();
    date.setHours(date.getHours() + 1);
    await updatePasswordToken(existingUser.id!, randomCharacters, date);
    const resetLink = `${config.CLIENT_URL}/reset-password/${randomCharacters}`;
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: email,
      resetLink,
      username: existingUser.username!,
      template: 'forgetPassword'
    };
    await publishDirectMessage(
      authChannel,
      'email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Forget password message sent to Notification Service'
    );
    res.status(StatusCodes.OK).json({ message: 'Reset password link sent to your email.' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { error } = await Promise.resolve(passwordSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Password resetPassword() method error');
    }

    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match.', 'Password resetPassword() method error');
    }
    const existingUser: IAuthDocument | undefined = await getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Invalid token.', 'Password resetPassword() method error');
    }

    const hashedPassword: string = await AuthModel.prototype.hashPassword(password);
    await updatePassword(existingUser.id!, hashedPassword);

    const messageDetails: IEmailMessageDetails = {
      username: existingUser.username,
      template: 'resetPasswordSuccess'
    };
    await publishDirectMessage(
      authChannel,
      'email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Reset password success message sent to Notification Service'
    );
    res.status(StatusCodes.OK).json({ message: 'Reset password successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { error } = await Promise.resolve(changePasswordSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Password changePassword() method error');
    }

    const { currentPassword, newPassword } = req.body;
    if (currentPassword !== newPassword) {
      throw new BadRequestError('Invalid password.', 'Password changePassword() method error');
    }
    const existingUser: IAuthDocument | undefined = await getAuthUserByUsernameOrEmail(`${req.currentUser?.username}`);
    if (!existingUser) {
      throw new BadRequestError('Invalid token.', 'Password changePassword() method error');
    }

    const hashedPassword: string = await AuthModel.prototype.hashPassword(newPassword);
    await updatePassword(existingUser.id!, hashedPassword);

    const messageDetails: IEmailMessageDetails = {
      username: existingUser.username,
      template: 'resetPasswordSuccess'
    };
    await publishDirectMessage(
      authChannel,
      'email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Change password success message sent to Notification Service'
    );
    res.status(StatusCodes.OK).json({ message: 'Changed password successfully.' });
  } catch (error) {
    next(error);
  }
}
