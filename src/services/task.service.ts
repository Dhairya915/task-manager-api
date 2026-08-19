import {
  addTask,
  getAllTasks,
  findTaskById,
  updateTask,
  deleteTask,
  getAllTasksForAdmin,
  updateTaskAttachment,
} from '../repositories/task.repository';
import { HttpError } from '../utils/HttpError';
import { ActivityLog } from '../models/ActivityLog.model';
import type { Task } from '@prisma/client';
import { redis } from '../lib/redis';
import { z } from 'zod';
import { updateTaskSchema } from '../validators/task.validator';
import { connections } from '../lib/websocket';

//create task
export async function createTask(title: string, userId: string) {
  const task = await addTask({ title, userId });
  await invalidateTaskCache(userId);

  await ActivityLog.create({
    userId,
    action: 'task.created',
    targetId: task.id,
    metadata: { title: task.title },
  });

  const socket = connections.get(userId);
  if (socket) {
    socket.send(JSON.stringify({ type: 'task.created', data: task }));
  }
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

//remove task
export async function removeTask(id: string, userId: string): Promise<void> {
  const deleted = await deleteTask(id, userId);

  if (!deleted) {
    throw new HttpError('Task not found', 404);
  }

  await invalidateTaskCache(userId);

  await ActivityLog.create({
    userId,
    action: 'task.deleted',
    targetId: id,
    metadata: {},
  });

  const socket = connections.get(userId);
  if (socket) {
    socket.send(JSON.stringify({ type: 'task.deleted', data: { id } }));
  }
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

//upload attachment
export async function uploadAttachment(
  id: string,
  userId: string,
  filePath: string
): Promise<Task> {
  const task = await updateTaskAttachment(id, userId, filePath);

  if (!task) {
    throw new HttpError('Task not found', 404);
  }

  return task;
}
