import express from 'express';
import { loginUser } from '../controllers/authController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Rota de login
router.post('/login', loginUser);

// Rota para validar token
router.get('/validate', authenticateToken, (req, res) => {
  res.status(200).json({ valid: true });
});

// Rota para obter dados do usuário atual
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        areaAccesses: {
          include: {
            area: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const areas = user.areaAccesses.map(access => access.area);

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      areas: areas,
    });
  } catch (error) {
    next(error);
  }
});

// Importar o serviço de email
import { sendPasswordResetEmail } from '../services/emailService.js';

// Rota para solicitar redefinição de senha
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      // Por segurança, não informamos se o email existe ou não
      return res.status(200).json({ 
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' 
      });
    }
    
    // Gerar token de redefinição
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
    
    // Salvar token no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    
    // Enviar email com o token de recuperação
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log(`Email de recuperação enviado para ${email}`);
    } catch (emailError) {
      console.error('Erro ao enviar email de recuperação:', emailError);
      // Não retornamos erro para o cliente por questões de segurança
    }
    
    // Resposta de sucesso (mesmo que o email não exista, por segurança)
    res.status(200).json({ 
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' 
    });
    
  } catch (error) {
    console.error('Erro na rota forgot-password:', error);
    next(error);
  }
});

// Rota para redefinir senha com token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }
    
    // Buscar usuário com o token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
    
    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    
    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    
  } catch (error) {
    next(error);
  }
});

export default router;
