import { Router } from 'express';
import { body, param } from 'express-validator';
import authenticateToken from '../middleware/authenticateToken.js';
import isAdmin from '../middleware/isAdmin.js';
import { auditCRUD } from '../middleware/auditMiddleware.js'; // Adicionar
import handleValidationErrors from '../utils/handleValidationErrors.js';
import {
  grantDashboardAccess,
  revokeDashboardAccess,
  getUserDashboardAccesses
} from '../controllers/dashboardController.js';

const router = Router();

// Adicionar auditoria nas rotas
router.post(
  '/grant',
  authenticateToken,
  isAdmin,
  auditCRUD('dashboard-permissions'),
  [
    body('userId', 'ID do usuário deve ser um número inteiro').isInt({ min: 1 }),
    body('dashboardId', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  grantDashboardAccess
);

router.post(
  '/revoke',
  authenticateToken,
  isAdmin,
  auditCRUD('dashboard-permissions'),
  [
    body('userId', 'ID do usuário deve ser um número inteiro').isInt({ min: 1 }),
    body('dashboardId', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  revokeDashboardAccess
);

router.get(
  '/user/:userId',
  authenticateToken,
  isAdmin,
  auditCRUD('dashboard-permissions'),
  [
    param('userId', 'ID do usuário deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  getUserDashboardAccesses
);

export default router;