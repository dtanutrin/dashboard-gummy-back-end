import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Erro Crítico: JWT_SECRET não está definido no arquivo .env");
  process.exit(1);
}

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userAreaAccesses: { // Inclui os acessos às áreas
          include: {
            area: true, // Inclui os dados da área em cada acesso
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Mapeia os acessos para um formato mais simples de áreas
    const areas = user.userAreaAccesses.map(access => access.area);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        // Não incluímos 'areas' diretamente no token JWT para mantê-lo menor,
        // mas o retornaremos na resposta do login e na rota /me.
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login bem-sucedido!",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        areas: areas, // Retorna as áreas do usuário
      },
    });

  } catch (error) {
    console.error("Erro no controller de login:", error);
    next(error);
  }
};

// A rota /me será ajustada em routes/auth.js para buscar e retornar as áreas também.

