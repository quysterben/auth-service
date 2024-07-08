import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@quysterben/jobber-shared';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    const checkIfUserExist: IAuthDocument | undefined = await getAuthUserByVerificationToken(token);
    if (!checkIfUserExist) {
      throw new BadRequestError('Invalid token', 'VerifyEmail update() method error');
    }
    await updateVerifyEmailField(checkIfUserExist.id!, 1, '');
    const updatedUser = await getAuthUserById(checkIfUserExist.id!);
    res.status(StatusCodes.OK).json({
      message: 'Email verified successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
}
