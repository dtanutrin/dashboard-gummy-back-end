import express from 'express';
import { getLogs, getLogStats, exportLogs, cleanOldLogs } from '../controllers/logController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

// Todas as rotas de logs requerem autenticação e permissão de admin
router.use(authenticateToken);
router.use(isAdmin);

// GET /api/logs - Listar logs com filtros
router.get('/', getLogs);

// GET /api/logs/stats - Estatísticas de logs
router.get('/stats', getLogStats);

// GET /api/logs/export - Exportar logs em CSV
router.get('/export', exportLogs);

// DELETE /api/logs - Limpar logs antigos
router.delete('/', cleanOldLogs);

export default router;