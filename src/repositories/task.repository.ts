import { prisma } from '../lib/prisma';
import type { Task } from '@prisma/client';
import { HttpError } from '../utils/HttpError';

export async function addTask(data: { title: string; userId: string }): Promise<Task> {
  return prisma.task.create({ data });
}

export async function getAllTasks(
  userId: string,
  options: { skip: number; take: number; completed?: boolean }
): Promise<Task[]> {
  const shouldFilter = options.completed !== undefined;
  const filterPart = shouldFilter && { completed: options.completed };

  return prisma.task.findMany({
    where: { userId, ...filterPart },
    skip: options.skip,
    take: options.take,
  });
}

export async function findTaskById(id: string, userId: string): Promise<Task | null> {
  return prisma.task.findFirst({ where: { id, userId } });
}

export async function updateTask(
  id: string,
  userId: string,
  updates: { title?: string; completed?: boolean }
): Promise<Task | null> {
  const taskExists = await prisma.task.findFirst({ where: { id, userId } });

  if (!taskExists) {
    return null;
  }

  return prisma.task.update({ where: { id }, data: updates });
}

export async function deleteTask(id: string, userId: string): Promise<boolean> {
  const taskExists = await prisma.task.findFirst({ where: { id, userId } });

  if (!taskExists) {
    return false;
  }

  await prisma.task.delete({ where: { id } });
  return true;
}

//admin

export async function getAllTasksForAdmin(): Promise<Task[]> {
  return prisma.task.findMany();
}
