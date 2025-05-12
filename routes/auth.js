import { Router } from 'express';
import { body } from 'express-validator';
import handleValidationErrors from '../utils/handleValidationErrors.js';
import { loginUser } from '../controllers/authController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = Router();

// Rota de Login
router.post(
  '/login',
  [
    body('email', 'Formato de email inválido').isEmail().normalizeEmail(),
    body('password', 'A senha não pode estar em branco').notEmpty(),
  ],
  handleValidationErrors,
  loginUser
);

// Rota para validar o token e obter dados do usuário logado
router.get('/me', authenticateToken, (req, res) => {
  // Se authenticateToken passar, o token é válido e req.user está populado.
  // O payload do token (userId, email, role) é retornado.
  // Se o token incluir mais dados do usuário, eles também estarão em req.user.
  res.status(200).json(req.user);
});

// Rota para uma validação simples de token (opcional, /me é geralmente mais útil)
router.get('/validate', authenticateToken, (req, res) => {
  // Se authenticateToken passar, o token é válido.
  // Retorna informações básicas do usuário decodificadas do token.
  res.status(200).json({ message: 'Token is valid.', user: req.user });
});

export default router;

