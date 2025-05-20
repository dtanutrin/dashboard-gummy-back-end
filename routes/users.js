// Caminho: dashboard-gummy-back-end/routes/users.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Rota para obter todos os usuários (apenas admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        UserAreaAccess: {
          select: {
            area: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Formatar a resposta para incluir áreas como array
    const formattedUsers = users.map(user => {
      const areas = user.UserAreaAccess.map(access => access.area);
      const { UserAreaAccess, ...userData } = user;
      return {
        ...userData,
        areas
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});


// Rota para obter perfil do usuário atual
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        UserAreaAccess: {
          select: {
            area: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// Rota para atualizar perfil do usuário atual
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    
    // Preparar dados para atualização
    const updateData = {};
    
    // Se o nome foi fornecido, atualizar
    if (name) {
      updateData.name = name;
    }
    
    // Se senha atual e nova foram fornecidas, verificar e atualizar
    if (currentPassword && newPassword) {
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: { password_hash: true }
      });
      
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }
      
      // Gerar hash da nova senha
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }
    
    // Atualizar usuário
    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// Rota para obter um usuário específico por ID (apenas admin)
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        UserAreaAccess: {
          select: {
            area: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Formatar a resposta para incluir áreas como array
    const areas = user.UserAreaAccess.map(access => access.area);
    const { UserAreaAccess, ...userData } = user;
    const formattedUser = {
      ...userData,
      areas
    };

    res.json(formattedUser);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Rota para criar um novo usuário (apenas admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email, password, role, name, areaIds } = req.body;

    // Validação básica
    if (!email || !role) {
      return res.status(400).json({ message: 'Email e role são obrigatórios' });
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Gerar hash da senha se fornecida, ou usar uma senha padrão
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10) 
      : await bcrypt.hash('password123', 10);

    // Criar o usuário
    const newUser = await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        role,
        name
      }
    });

    // Se areaIds foram fornecidos, criar os acessos às áreas
    if (areaIds && areaIds.length > 0) {
      const areaAccesses = areaIds.map(areaId => ({
        user_id: newUser.id,
        area_id: areaId
      }));

      await prisma.userAreaAccess.createMany({
        data: areaAccesses
      });
    }

    res.status(201).json({ 
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

// Rota para atualizar um usuário existente (apenas admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, name, areaIds } = req.body;

    // Verificar se o usuário existe
    const user = await prisma.users.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o novo email já está em uso por outro usuário
    if (email && email !== user.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    // Atualizar o usuário
    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data: {
        email: email || user.email,
        role: role || user.role,
        name: name !== undefined ? name : user.name
      }
    });

    // Se areaIds foram fornecidos, atualizar os acessos às áreas
    if (areaIds) {
      // Remover todos os acessos existentes
      await prisma.userAreaAccess.deleteMany({
        where: { user_id: Number(id) }
      });

      // Adicionar os novos acessos
      if (areaIds.length > 0) {
        const areaAccesses = areaIds.map(areaId => ({
          user_id: Number(id),
          area_id: areaId
        }));

        await prisma.userAreaAccess.createMany({
          data: areaAccesses
        });
      }
    }

    res.json({ 
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
});

// Rota para excluir um usuário (apenas admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe
    const user = await prisma.users.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remover todos os acessos às áreas
    await prisma.userAreaAccess.deleteMany({
      where: { user_id: Number(id) }
    });

    // Excluir o usuário
    await prisma.users.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário' });
  }
});

// Rota para atualizar a senha de um usuário (apenas admin)
router.put('/:id/password', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Senha é obrigatória' });
    }

    // Verificar se o usuário existe
    const user = await prisma.users.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar a senha do usuário
    await prisma.users.update({
      where: { id: Number(id) },
      data: { password_hash: hashedPassword }
    });

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro ao atualizar senha' });
  }
});

// NOVA ROTA: Perfil do usuário - Obter perfil do usuário atual
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        UserAreaAccess: {
          select: {
            area: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Formatar a resposta para incluir áreas como array
    const areas = user.UserAreaAccess.map(access => access.area);
    const { UserAreaAccess, ...userData } = user;
    const formattedUser = {
      ...userData,
      areas
    };

    res.json(formattedUser);
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário' });
  }
});

// NOVA ROTA: Atualizar perfil do usuário atual
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, currentPassword, newPassword } = req.body;

    // Verificar se o usuário existe
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Dados para atualização
    const updateData = {};
    
    // Atualizar nome se fornecido
    if (name !== undefined) {
      updateData.name = name;
    }

    // Atualizar senha se fornecida
    if (currentPassword && newPassword) {
      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Senha atual incorreta' });
      }
      
      // Gerar hash da nova senha
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }

    // Se não há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
    }

    // Atualizar o usuário
    const updatedUser = await prisma.users.update({
      where: { id: Number(userId) },
      data: updateData
    });

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

export default router;
