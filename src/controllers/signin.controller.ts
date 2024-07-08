import { Request, Response, NextFunction } from 'express';
import { signinSchema } from '@auth/schemes/signin';
import { BadRequestError, IAuthDocument } from '@quysterben/jobber-shared';
import { getAuthUserByUsernameOrEmail, signToken } from '@auth/services/auth.service';
import { AuthModel } from '@auth/models/auth.schema';
import { omit } from 'lodash';
import { StatusCodes } from 'http-status-codes';

export async function read(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { error } = await Promise.resolve(signinSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'SignIn read() method error');
    }

    const { username, password } = req.body;
    const existingUser: IAuthDocument | undefined = await getAuthUserByUsernameOrEmail(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid Credentials.', 'SignIn read() method error');
    }
    const isPasswordMatch: boolean = await AuthModel.prototype.comparePassword(password, existingUser.password!);
    if (!isPasswordMatch) {
      throw new BadRequestError('Invalid Credentials.', 'SignIn read() method error');
    }

    const userJWT: string = signToken(existingUser.id!, existingUser.email!, existingUser.username!);
    const userData: IAuthDocument = omit(existingUser, ['password']);
    res.status(StatusCodes.OK).json({
      message: 'User signed in successfully',
      user: userData,
      token: userJWT
    });
  } catch (error) {
    next(error);
  }
}
