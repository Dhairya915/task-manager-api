import { prisma } from '../lib/prisma';
import type { User } from '@prisma/client';

export async function createUser(data: {email: string , password: string}): Promise<User>{
    return prisma.user.create({ data });
}

export async function findUserByEmail(email: string): Promise<User | null>{
    return prisma.user.findUnique({where : {email : email}});
}

