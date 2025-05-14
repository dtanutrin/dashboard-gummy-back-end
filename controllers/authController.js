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
        areaAccesses: { // Corrigido para areaAccesses
          include: {
            area: true, 
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const areas = user.areaAccesses.map(access => access.area);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
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
        name: user.name, // Adicionando o nome do usuário se existir no seu schema
        areas: areas, 
      },
    });

  } catch (error) {
    console.error("Erro no controller de login:", error);
    next(error);
  }
};

