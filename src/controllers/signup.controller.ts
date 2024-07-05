import crypto from 'crypto';

import { signupSchema } from '@auth/schemes/signup';
import { createAuthUser, getAuthUserByUsernameOrEmail, signToken } from '@auth/services/auth.service';
import { BadRequestError, firstLetterUppercase, IAuthDocument, IEmailMessageDetails, uploads } from '@quysterben/jobber-shared';
import { UploadApiResponse } from 'cloudinary';
import { Response, Request } from 'express';
import { v4 as uuidV4 } from 'uuid';
import { lowerCase } from 'lodash';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';

export async function create(req: Request, res: Response): Promise<void> {
  // validate and check if user exist
  const { error } = await Promise.resolve(signupSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
  }
  const { username, email, password, country, profilePicture } = req.body;
  const checkIfUserExist: IAuthDocument | undefined = await getAuthUserByUsernameOrEmail(username, email);
  if (checkIfUserExist) {
    throw new BadRequestError('Invalid Credentials. Email or username', 'SignUp create() method error');
  }

  // upload profile img
  const profilePublicId = uuidV4();
  const uploadResult: UploadApiResponse = (await uploads(profilePicture, `${profilePublicId}`, true, true)) as UploadApiResponse;
  if (!uploadResult.public_id) {
    throw new BadRequestError('Profile picture upload failed', 'SignUp create() method error');
  }

  // create && generate email verification link && send email
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  const authData: IAuthDocument = {
    username: firstLetterUppercase(username),
    email: lowerCase(email),
    profilePublicId,
    profilePicture: uploadResult?.secure_url,
    emailVerificationToken: randomCharacters,
    password,
    country
  } as IAuthDocument;
  const result: IAuthDocument = (await createAuthUser(authData)) as IAuthDocument;
  const verifyLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: result.email,
    verifyLink,
    template: 'verifyEmail'
  };
  await publishDirectMessage(
    authChannel,
    'buyer-update',
    'user-buyer',
    JSON.stringify(messageDetails),
    'Buyer details sent to buyer service.'
  );

  // sign jwt token and send response
  const userJWT: string = signToken(result.id!, result.email!, result.username!);
  res.status(StatusCodes.CREATED).send({ message: 'User created successfully', user: result, token: userJWT });
}
