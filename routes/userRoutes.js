import express from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import isAdmin from '../middleware/isAdmin.js';
import { auditCRUD, captureAuditData } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Rotas de Usuário (protegidas e algumas restritas a Admin)

// Criar um novo usuário (Admin)
router.post('/', authenticateToken, isAdmin, captureAuditData, auditCRUD('users'), createUser);

// Obter todos os usuários (Admin)
router.get('/', authenticateToken, isAdmin, captureAuditData, auditCRUD('users'), getAllUsers);

// Obter um usuário por ID (Admin ou o próprio usuário para seus dados)
router.get('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('users'), getUserById);

// Atualizar um usuário (Admin)
router.put('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('users'), updateUser);

// Deletar um usuário (Admin)
router.delete('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('users'), deleteUser);

export default router;

