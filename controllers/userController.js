const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

// Criar um novo Usuário
exports.createUser = async (req, res) => {
  const { email, password, role, areaIds } = req.body; // areaIds é um array de IDs de Area

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Um usuário com este email já existe." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: role || "User", // Default to "User" if not provided
        areaAccesses: areaIds && areaIds.length > 0 
          ? {
              create: areaIds.map((id) => ({ areaId: parseInt(id) })),
            }
          : undefined,
      },
      include: {
        areaAccesses: {
          include: {
            area: true,
          },
        },
      },
    });

    // Remover passwordHash da resposta
    const { passwordHash, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(400).json({ error: "Uma ou mais IDs de área fornecidas são inválidas." });
    }
    res.status(500).json({ error: "Erro interno do servidor ao criar usuário." });
  }
};

// Obter todos os Usuários
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        email: "asc",
      },
      include: {
        areaAccesses: {
          include: {
            area: true, // Inclui os detalhes da área
          },
        },
      },
    });
    // Remover passwordHash de todos os usuários na resposta
    const usersWithoutPasswords = users.map(user => {
      const { passwordHash, ...rest } = user;
      return {
        ...rest,
        areas: user.areaAccesses.map(access => access.area) // Simplifica para um array de Areas
      };
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor ao buscar usuários." });
  }
};

// Obter um Usuário por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        areaAccesses: {
          include: {
            area: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({
        ...userWithoutPassword,
        areas: user.areaAccesses.map(access => access.area)
    });
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    res.status(500).json({ error: "Erro interno do servidor ao buscar usuário." });
  }
};

// Atualizar um Usuário
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, role, areaIds } = req.body;

  try {
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Obter acessos de área atuais para o usuário
    const currentUserAreaAccesses = await prisma.userAreaAccess.findMany({
        where: { userId: parseInt(id) }
    });
    const currentAreaIds = currentUserAreaAccesses.map(access => access.areaId);

    const areaIdsToCreate = areaIds ? areaIds.filter(areaId => !currentAreaIds.includes(parseInt(areaId))) : [];
    const areaAccessesToDelete = areaIds ? currentUserAreaAccesses.filter(access => !areaIds.includes(access.areaId)) : currentUserAreaAccesses;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        email: email,
        passwordHash: hashedPassword, // undefined se a senha não for alterada
        role: role,
        areaAccesses: {
          create: areaIdsToCreate.map((areaId) => ({ areaId: parseInt(areaId) })),
          deleteMany: areaAccessesToDelete.map(access => ({userId: parseInt(id), areaId: access.areaId})),
        },
      },
      include: {
        areaAccesses: {
          include: {
            area: true,
          },
        },
      },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json({
        ...userWithoutPassword,
        areas: updatedUser.areaAccesses.map(access => access.area)
    });

  } catch (error) {
    if (error.code === "P2025") { // Registro não encontrado
      return res.status(404).json({ error: "Usuário não encontrado para atualização." });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) { // Violação de unicidade no email
        return res.status(400).json({ error: "Este email já está em uso por outro usuário." });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(400).json({ error: "Uma ou mais IDs de área fornecidas são inválidas." });
    }
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor ao atualizar usuário." });
  }
};

// Deletar um Usuário
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // O Prisma cuidará da exclusão em cascata de UserAreaAccess devido ao onDelete: Cascade no schema
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado para exclusão." });
    }
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor ao deletar usuário." });
  }
};

