import { Router } from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import { listAreas } from '../controllers/areasController.js';
import { auditCRUD, captureAuditData } from '../middleware/auditMiddleware.js';

const router = Router();

// Rota para LISTAR todas as áreas (GET /api/areas)
// Protegida por autenticação (qualquer usuário logado pode ver as áreas para seleção)
router.get('/', authenticateToken, listAreas);

// Aplicar em todas as rotas que usam auditCRUD
router.post('/', authenticateToken, isAdmin, captureAuditData, auditCRUD('areas'), createArea);
router.put('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('areas'), updateArea);
router.delete('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('areas'), deleteArea);

export default router;
