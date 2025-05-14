import express from "express";
const router = express.Router();
import { createArea, getAllAreas, getAreaById, updateArea, deleteArea } from "../controllers/areaController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

// Rotas para Áreas (protegidas e apenas para admin)
router.post("/", authenticateToken, isAdmin, createArea);
router.get("/", authenticateToken, isAdmin, getAllAreas); // Admin pode ver todas as áreas para gerenciamento
router.get("/:id", authenticateToken, isAdmin, getAreaById);
router.put("/:id", authenticateToken, isAdmin, updateArea);
router.delete("/:id", authenticateToken, isAdmin, deleteArea);

export default router;

