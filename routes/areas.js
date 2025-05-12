import { Router } from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import { listAreas } from '../controllers/areasController.js';

const router = Router();

// Rota para LISTAR todas as áreas (GET /api/areas)
// Protegida por autenticação (qualquer usuário logado pode ver as áreas para seleção)
router.get('/', authenticateToken, listAreas);

export default router;
