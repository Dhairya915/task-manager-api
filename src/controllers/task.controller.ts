import type { Request, Response } from 'express';
import {
  createTask,
  listTasks,
  getTaskById,
  removeTask,
  editTask,
  listAllTasksAdmin,
  uploadAttachment,
} from '../services/task.service';
import { HttpError } from '../utils/HttpError';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator';

export async function createTaskHandler(req: Request, res: Response) {
  const parsed = createTaskSchema.parse(req.body);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError('Not authorized', 401);
  }

  const task = await createTask(parsed.title, userId);
  res.status(201).json(task);
}

export async function listTaskHandler(req: Request, res: Response) {
  const userId = req.userId;

  if (!userId) {
    throw new HttpError('Not authorized', 401);
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const completed =
    req.query.completed === 'true'
      ? true
      : req.query.completed === 'false'
        ? false
        : undefined;

  const tasks = await listTasks(userId, { skip, take: limit, completed });
  res.status(200).json(tasks);
}

export async function getTaskByIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.userId;

  if (!id || Array.isArray(id)) {
    throw new HttpError('Invalid task id', 400);
  }

  if (!userId) {
    throw new HttpError('Not authorized', 401);
  }

  const task = await getTaskById(id, userId);
  res.status(200).json(task);
}

export async function updateTaskHandler(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.userId;

  if (!id || Array.isArray(id)) {
    throw new HttpError('Invalid task id', 400);
  }

  if (!userId) {
    throw new HttpError('Not authorized', 401);
  }

  const updates = updateTaskSchema.parse(req.body);
  const task = await editTask(id, userId, updates);
  res.status(200).json(task);
}

export async function deleteTaskHandler(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.userId;

  if (!id || Array.isArray(id)) {
    throw new HttpError('Invalid task id', 400);
  }

  if (!userId) {
    throw new HttpError('Not authorized', 401);
  }

  await removeTask(id, userId);
  res.status(204).send();
}

//admin
export async function listAllTasksAdminHandler(req: Request, res: Response) {
  const tasks = await listAllTasksAdmin();
  res.status(200).json(tasks);
}

//upload attachment
export async function uploadAttachmentHandler(req: Request, res: Response) {
  if (!req.file) {
    throw new HttpError('No file uploaded', 400);
  }

  const task = await uploadAttachment(
    req.params.id as string,
    req.userId as string,
    req.file.path
  );
  res.status(200).json(task);
}
