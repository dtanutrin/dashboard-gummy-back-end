import prisma from '../config/prisma.js'; // Importa a instância singleton do Prisma
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Carrega variáveis de ambiente

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Erro Crítico: JWT_SECRET não está definido no arquivo .env");
  process.exit(1); // Encerra a aplicação se o segredo JWT não estiver configurado
}

// Controller para lidar com o login do usuário
export const loginUser = async (req, res, next) => {
  // A validação já foi feita pelo middleware express-validator na rota
  const { email, password } = req.body;

  try {
    // 1. Encontrar o usuário pelo email usando o Prisma Client centralizado
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Verifica se o usuário existe e se a senha está correta
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      // Retorna 401 Unauthorized para credenciais inválidas (não especifica se é email ou senha)
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 3. Gerar o token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role, // Inclui o papel (role) no payload do token
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Define a expiração do token (ex: 1 hora)
    );

    // 4. Retornar o token e informações básicas do usuário (sem a senha)
    res.json({
      message: 'Login bem-sucedido!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Erro no controller de login:', error);
    // Passa o erro para o middleware de tratamento de erros genérico
    next(error);
  }
};

// TODO: Adicionar controller para registro (registerUser) se necessário.

