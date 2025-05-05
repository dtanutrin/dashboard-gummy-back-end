import { Router } from 'express';
import { body, param } from 'express-validator'; // Importa 'body' e 'param' para validação
import authenticateToken from '../middleware/authenticateToken.js';
import isAdmin from '../middleware/isAdmin.js';
import handleValidationErrors from '../utils/handleValidationErrors.js'; // Importa o handler de erros de validação
import {
  listDashboards,
  getDashboardById,
  addDashboard,
  updateDashboard,
  deleteDashboard
} from '../controllers/dashboardController.js'; // Importa os controllers

const router = Router();

// --- Rotas de Dashboard --- //

// Rota para LISTAR dashboards (GET /api/dashboards)
// Protegida por autenticação. A lógica de filtragem está no controller.
router.get('/', authenticateToken, listDashboards);

// Rota para OBTER um dashboard específico por ID (GET /api/dashboards/:id)
// Protegida por autenticação. Valida o ID e chama o controller.
router.get(
  '/:id',
  authenticateToken,
  // 1. Validação do parâmetro ID
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  // 2. Middleware para tratar erros de validação
  handleValidationErrors,
  // 3. Controller para buscar o dashboard
  getDashboardById
);

// Rota para ADICIONAR um novo dashboard (POST /api/dashboards)
// Protegida por autenticação e requer privilégios de Admin.
// Valida o corpo da requisição e chama o controller.
router.post(
  '/',
  authenticateToken,
  isAdmin,
  // 1. Regras de Validação do Corpo
  [
    body('name', 'Nome do dashboard é obrigatório').notEmpty().trim(),
    body('url', 'URL inválida').isURL(),
    body('areaId', 'ID da área deve ser um número inteiro').isInt({ min: 1 })
    // TODO: Adicionar validação para verificar se a areaId realmente existe no banco?
    // Isso pode ser feito com um custom validator ou no controller.
  ],
  // 2. Middleware para tratar erros de validação
  handleValidationErrors,
  // 3. Controller para adicionar o dashboard
  addDashboard
);

// Rota para ATUALIZAR um dashboard existente (PUT /api/dashboards/:id)
// Protegida por autenticação e requer privilégios de Admin.
// Valida o ID, o corpo e chama o controller.
router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  // 1. Validação do Parâmetro e do Corpo
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 }),
    body('name', 'Nome do dashboard é obrigatório').notEmpty().trim(),
    body('url', 'URL inválida').isURL(),
    body('areaId', 'ID da área deve ser um número inteiro').isInt({ min: 1 })
    // TODO: Validar existência da areaId?
  ],
  // 2. Middleware para tratar erros de validação
  handleValidationErrors,
  // 3. Controller para atualizar o dashboard
  updateDashboard
);

// Rota para EXCLUIR um dashboard (DELETE /api/dashboards/:id)
// Protegida por autenticação e requer privilégios de Admin.
// Valida o ID e chama o controller.
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  // 1. Validação do parâmetro ID
  [
    param('id', 'ID do dashboard deve ser um número inteiro').isInt({ min: 1 })
  ],
  // 2. Middleware para tratar erros de validação
  handleValidationErrors,
  // 3. Controller para excluir o dashboard
  deleteDashboard
);

export default router;

