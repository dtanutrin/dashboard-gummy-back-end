import { Router } from 'express';
import { body, param } from 'express-validator';
import authenticateToken from '../middleware/authenticateToken.js';
import isAdmin from '../middleware/isAdmin.js';
import { auditCRUD, captureAuditData } from '../middleware/auditMiddleware.js';
import handleValidationErrors from '../utils/handleValidationErrors.js';
import {
  listDashboards,
  getDashboardById,
  addDashboard,
  updateDashboard,
  deleteDashboard,
  trackDashboardAccess
} from '../controllers/dashboardController.js';

const router = Router();

// Rotas com auditoria adicionada
router.get('/', authenticateToken, captureAuditData, auditCRUD('dashboards'), listDashboards);

router.get(
  '/:id',
  authenticateToken,
  captureAuditData,
  auditCRUD('dashboards'),
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  getDashboardById
);

router.post(
  '/',
  authenticateToken,
  isAdmin,
  captureAuditData,
  auditCRUD('dashboards'),
  [
    body('name', 'Nome do dashboard é obrigatório').notEmpty().trim(),
    body('url', 'URL inválida').isURL(),
    body('areaId', 'ID da área deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  addDashboard
);

router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  captureAuditData,
  auditCRUD('dashboards'),
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 }),
    body('name', 'Nome do dashboard é obrigatório').notEmpty().trim(),
    body('url', 'URL inválida').isURL(),
    body('areaId', 'ID da área deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  updateDashboard
);

router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  captureAuditData,
  auditCRUD('dashboards'),
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  deleteDashboard
);

// Nova rota para rastrear acesso ao dashboard
router.post(
  '/:id/access',
  authenticateToken,
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  handleValidationErrors,
  trackDashboardAccess
);

export default router;

