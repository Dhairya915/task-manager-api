import { addTask , getAllTasks ,findTaskById , updateTask , deleteTask} from "../repositories/task.repository";
import { HttpError } from "../utils/HttpError";
import type { Task } from "@prisma/client";
import { z } from 'zod';
import { updateTaskSchema } from '../validators/task.validator';


export async function createTask(title: string , userId : string){

    return addTask({ title , userId });
}

export async function listTasks(userId : string){

    return getAllTasks(userId);
}

export async function getTaskById(id: string, userId: string): Promise<Task> {
  const task = await findTaskById(id,userId);

  if (!task) {
    throw new HttpError('Task not found', 404);
  }

  return task;
}

export async function editTask(id: string, userId: string, updates: z.infer<typeof updateTaskSchema>): Promise<Task> {
  const task = await updateTask(id, userId, updates);

  if (!task) {
    throw new HttpError('Task not found', 404);
  }

  return task;
}

export async function removeTask(id: string, userId: string): Promise<void> {
  const deleted = await deleteTask(id, userId);

  if (!deleted) {
    throw new HttpError('Task not found', 404);
  }
}