import { Router } from 'express';
import { body, param } from 'express-validator';
import authenticateToken from '../middleware/authenticateToken.js';
import isAdmin from '../middleware/isAdmin.js';
import handleValidationErrors from '../utils/handleValidationErrors.js';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = Router();

// Rota para CRIAR um novo usuário (POST /api/users)
// Protegida por autenticação e requer privilégios de Admin.
router.post(
  '/',
  authenticateToken,
  isAdmin,
  [
    body('email', 'Formato de email inválido').isEmail().normalizeEmail(),
    body('password', 'A senha deve ter no mínimo 6 caracteres').isLength({ min: 6 }),
    body('role', 'Role é obrigatório e deve ser Admin ou User').isIn(['Admin', 'User']),
    // A validação de 'areas' (IDs de área) pode ser mais complexa e feita no controller
    // para verificar se os IDs existem e se o formato está correto (array de números).
    body('areas', 'Áreas deve ser um array de IDs de área').optional().isArray(),
    body('areas.*', 'Cada ID de área deve ser um número inteiro').optional().isInt({ min: 1 })
  ],
  handleValidationErrors,
  createUser
);

// Rota para LISTAR todos os usuários (GET /api/users)
// Protegida por autenticação e requer privilégios de Admin.
router.get('/', authenticateToken, isAdmin, getAllUsers);

// Rota para OBTER um usuário específico por ID (GET /api/users/:id)
// Protegida por autenticação e requer privilégios de Admin.
router.get(
  '/:id',
  authenticateToken,
  isAdmin,
  [param('id', 'ID do usuário deve ser um número inteiro').isInt({ min: 1 })],
  handleValidationErrors,
  getUserById
);

// Rota para ATUALIZAR um usuário existente (PUT /api/users/:id)
// Protegida por autenticação e requer privilégios de Admin.
router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  [
    param('id', 'ID do usuário deve ser um número inteiro').isInt({ min: 1 }),
    body('email', 'Formato de email inválido').optional().isEmail().normalizeEmail(),
    body('password', 'A senha deve ter no mínimo 6 caracteres').optional().isLength({ min: 6 }),
    body('role', 'Role deve ser Admin ou User').optional().isIn(['Admin', 'User']),
    body('areas', 'Áreas deve ser um array de IDs de área').optional().isArray(),
    body('areas.*', 'Cada ID de área deve ser um número inteiro').optional().isInt({ min: 1 })
  ],
  handleValidationErrors,
  updateUser
);

// Rota para EXCLUIR um usuário (DELETE /api/users/:id)
// Protegida por autenticação e requer privilégios de Admin.
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  [param('id', 'ID do usuário deve ser um número inteiro').isInt({ min: 1 })],
  handleValidationErrors,
  deleteUser
);

export default router;
