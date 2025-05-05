import { Router } from 'express';
import { body } from 'express-validator'; // Importa 'body' para validação
import handleValidationErrors from '../utils/handleValidationErrors.js'; // Importa o handler de erros de validação
import { loginUser } from '../controllers/authController.js'; // Importa o controller

const router = Router();

// Rota de Login com Validação
router.post(
  '/login',
  // 1. Regras de Validação
  [
    body('email', 'Formato de email inválido').isEmail().normalizeEmail(),
    body('password', 'A senha não pode estar em branco').notEmpty(),
  ],
  // 2. Middleware para tratar erros de validação
  handleValidationErrors,
  // 3. Controller para lidar com a lógica de login
  loginUser
);

// TODO: Adicionar rota de registro (/register) se necessário, com validação e controller.

export default router;

