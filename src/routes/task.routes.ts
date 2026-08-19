import { Router } from 'express';
import {
  createTaskHandler,
  listTaskHandler,
  updateTaskHandler,
  getTaskByIdHandler,
  deleteTaskHandler,
  listAllTasksAdminHandler,
} from '../controllers/task.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { uploadAttachmentHandler } from '../controllers/task.controller';

const router = Router();

router.post('/tasks', requireAuth, createTaskHandler);
router.get('/tasks', requireAuth, listTaskHandler);
router.get('/tasks/:id', requireAuth, getTaskByIdHandler);
router.patch('/tasks/:id', requireAuth, updateTaskHandler);
router.delete('/tasks/:id', requireAuth, deleteTaskHandler);

//admin
router.get('/admin/tasks', requireAuth, requireAdmin, listAllTasksAdminHandler);

//attachment
router.post(
  '/tasks/:id/attachment',
  requireAuth,
  upload.single('file'),
  uploadAttachmentHandler
);

export default router;
