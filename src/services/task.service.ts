import {
  addTask,
  getAllTasks,
  findTaskById,
  updateTask,
  deleteTask,
  getAllTasksForAdmin,
} from '../repositories/task.repository';
import { HttpError } from '../utils/HttpError';
import type { Task } from '@prisma/client';
import { redis } from '../lib/redis';
import { z } from 'zod';
import { updateTaskSchema } from '../validators/task.validator';

export async function createTask(title: string, userId: string) {
  const task = await addTask({ title, userId });
  await invalidateTaskCache(userId);
  return task;
}

export async function listTasks(
  userId: string,
  options: { skip: number; take: number; completed?: boolean }
) {
  const cacheKey = `tasks:${userId}:${options.skip}:${options.take}:${options.completed}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const tasks = await getAllTasks(userId, options);

  await redis.set(cacheKey, JSON.stringify(tasks), 'EX', 60);

  return tasks;
}

export async function getTaskById(id: string, userId: string): Promise<Task> {
  const task = await findTaskById(id, userId);

  if (!task) {
    throw new HttpError('Task not found', 404);
  }

  return task;
}

export async function editTask(
  id: string,
  userId: string,
  updates: z.infer<typeof updateTaskSchema>
): Promise<Task> {
  const task = await updateTask(id, userId, updates);

  if (!task) {
    throw new HttpError('Task not found', 404);
  }

  await invalidateTaskCache(userId);

  return task;
}

export async function removeTask(id: string, userId: string): Promise<void> {
  const deleted = await deleteTask(id, userId);

  if (!deleted) {
    throw new HttpError('Task not found', 404);
  }

  await invalidateTaskCache(userId);
}

//admin
export async function listAllTasksAdmin() {
  return getAllTasksForAdmin();
}

//catch
async function invalidateTaskCache(userId: string) {
  const keys = await redis.keys(`tasks:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
