const express = require("express");
const router = express.Router();
const areaController = require("../controllers/areaController");
const authenticateToken = require("../middleware/authenticateToken");
const isAdmin = require("../middleware/isAdmin");

// Rotas para Áreas (protegidas e apenas para admin)
router.post("/", authenticateToken, isAdmin, areaController.createArea);
router.get("/", authenticateToken, isAdmin, areaController.getAllAreas); // Admin pode ver todas as áreas para gerenciamento
// Para usuários comuns, a lista de áreas acessíveis virá de outra lógica, possivelmente via /api/auth/me ou similar
router.get("/:id", authenticateToken, isAdmin, areaController.getAreaById);
router.put("/:id", authenticateToken, isAdmin, areaController.updateArea);
router.delete("/:id", authenticateToken, isAdmin, areaController.deleteArea);

module.exports = router;

