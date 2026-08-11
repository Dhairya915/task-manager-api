import { Router } from "express";
import { createTaskHandler , listTaskHandler , updateTaskHandler , getTaskByIdHandler ,deleteTaskHandler } from "../controllers/task.controller";
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/tasks', requireAuth, createTaskHandler);
router.get('/tasks', requireAuth, listTaskHandler);
router.get('/tasks/:id', requireAuth,getTaskByIdHandler);
router.patch('/tasks/:id', requireAuth, updateTaskHandler);
router.delete('/tasks/:id', requireAuth, deleteTaskHandler);

export default router;