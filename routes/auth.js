import { Router } from "express";
import { body } from "express-validator";
import handleValidationErrors from "../utils/handleValidationErrors.js";
import { loginUser } from "../controllers/authController.js";
import authenticateToken from "../middleware/authenticateToken.js";
import prisma from "../config/prisma.js"; // Importar Prisma Client

const router = Router();

// Rota de Login
router.post(
  "/login",
  [
    body("email", "Formato de email inválido").isEmail().normalizeEmail(),
    body("password", "A senha não pode estar em branco").notEmpty(),
  ],
  handleValidationErrors,
  loginUser
);

// Rota para validar o token e obter dados do usuário logado
router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    // req.user contém o payload do token (userId, email, role)
    const userId = req.user.userId;

    const userWithAreas = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true, // Incluir o nome do usuário se existir
        userAreaAccesses: {
          select: {
            area: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!userWithAreas) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Formatar as áreas para o frontend
    const areas = userWithAreas.userAreaAccesses.map(access => access.area);

    res.status(200).json({
      id: userWithAreas.id,
      email: userWithAreas.email,
      role: userWithAreas.role,
      name: userWithAreas.name,
      areas: areas, // Inclui as áreas formatadas
    });

  } catch (error) {
    console.error("Erro na rota /me:", error);
    next(error);
  }
});

// Rota para uma validação simples de token (opcional, /me é geralmente mais útil)
router.get("/validate", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Token is valid.", user: req.user });
});

export default router;

