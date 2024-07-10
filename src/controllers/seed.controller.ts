import crypto from 'crypto';

import { createAuthUser, getAuthUserByUsernameOrEmail } from '@auth/services/auth.service';
import { faker } from '@faker-js/faker';
import { BadRequestError, firstLetterUppercase, IAuthDocument, lowerCase } from '@quysterben/jobber-shared';
import { Request, Response, NextFunction } from 'express';
import { generateUsername } from 'unique-username-generator';
import { v4 as uuidV4 } from 'uuid';
import { sample } from 'lodash';
import { StatusCodes } from 'http-status-codes';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { count } = req.params;
    const usernames: string[] = [];
    for (let i = 0; i < parseInt(count, 10); i++) {
      const username: string = generateUsername('', 0, 12);
      usernames.push(firstLetterUppercase(username));
    }
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const email = faker.internet.email();
      const password = 'qwerty';
      const country = faker.location.country();
      const profilePicture = faker.image.urlPicsumPhotos();
      const checkIfUserExists: IAuthDocument | undefined = await getAuthUserByUsernameOrEmail(username, email);
      if (checkIfUserExists) {
        throw new BadRequestError('Invalid credentials. Email or Username', 'Seed create() method error');
      }
      const profilePublicId = uuidV4();
      const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
      const randomCharacters: string = randomBytes.toString('hex');
      const authData: IAuthDocument = {
        username: firstLetterUppercase(username),
        email: lowerCase(email),
        profilePublicId,
        profilePicture,
        emailVerificationToken: randomCharacters,
        password,
        emailVerified: sample([0, 1]),
        country
      } as IAuthDocument;
      await createAuthUser(authData);
    }
    res.status(StatusCodes.OK).json({
      message: 'Seed data created successfully.'
    });
  } catch (error) {
    next(error);
  }
}
