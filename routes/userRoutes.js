const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authenticateToken");
const { isAdmin } = require("../middleware/isAdmin");

// Rotas de Usuário (protegidas e algumas restritas a Admin)

// Criar um novo usuário (Admin)
router.post("/", authenticateToken, isAdmin, userController.createUser);

// Obter todos os usuários (Admin)
router.get("/", authenticateToken, isAdmin, userController.getAllUsers);

// Obter um usuário por ID (Admin ou o próprio usuário para seus dados - lógica a ser implementada no controller se necessário)
// Por enquanto, apenas Admin para simplificar
router.get("/:id", authenticateToken, isAdmin, userController.getUserById);

// Atualizar um usuário (Admin)
router.put("/:id", authenticateToken, isAdmin, userController.updateUser);

// Deletar um usuário (Admin)
router.delete("/:id", authenticateToken, isAdmin, userController.deleteUser);

module.exports = router;

