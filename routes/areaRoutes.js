import express from "express";
const router = express.Router();
import { createArea, getAllAreas, getAreaById, updateArea, deleteArea } from "../controllers/areaController.js";
import authenticateToken from "../middleware/authenticateToken.js";
import isAdmin from "../middleware/isAdmin.js";

// Rotas para Áreas
router.post("/", authenticateToken, isAdmin, createArea); // Apenas Admin pode criar
router.get("/", authenticateToken, getAllAreas); // Todos autenticados podem listar (filtrado no controller)
router.get("/:id", authenticateToken, getAreaById); // Todos autenticados podem ver (filtrado no controller)
router.put("/:id", authenticateToken, isAdmin, updateArea); // Apenas Admin pode atualizar
router.delete("/:id", authenticateToken, isAdmin, deleteArea); // Apenas Admin pode deletar

export default router;

