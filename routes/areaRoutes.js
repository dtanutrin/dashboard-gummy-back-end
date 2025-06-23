import express from 'express';
const router = express.Router(); // Esta linha deve ser:
// const router = express.Router(); -> OK, esta sintaxe está correta

// O problema real é que a importação do express está funcionando,
// mas vou verificar se há algum problema de ordem dos middlewares
import { createArea, getAllAreas, getAreaById, updateArea, deleteArea } from "../controllers/areaController.js";
import authenticateToken from "../middleware/authenticateToken.js";
import isAdmin from "../middleware/isAdmin.js";
import { auditCRUD, captureAuditData } from '../middleware/auditMiddleware.js';

// Rotas para Áreas
router.post('/', authenticateToken, isAdmin, captureAuditData, auditCRUD('areas'), createArea);
router.get('/', authenticateToken, captureAuditData, auditCRUD('areas'), getAllAreas);
router.get('/:id', authenticateToken, captureAuditData, auditCRUD('areas'), getAreaById);
router.put('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('areas'), updateArea);
router.delete('/:id', authenticateToken, isAdmin, captureAuditData, auditCRUD('areas'), deleteArea);

export default router;

