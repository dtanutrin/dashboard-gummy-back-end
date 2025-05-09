import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

// Helper function to exclude password hash from user object
const excludePassword = (user) => {
  if (user) {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

export const createUser = async (req, res) => {
  const { email, password, role, areas } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: role || "User", // Default to 'User' if not provided
        },
      });

      if (areas && areas.length > 0) {
        // Ensure areas are valid numbers and exist (optional: add validation here or rely on DB constraints)
        const areaConnections = areas.map((areaId) => ({
          userId: user.id,
          areaId: parseInt(areaId, 10),
        }));
        await tx.userAreaAccess.createMany({
          data: areaConnections,
          skipDuplicates: true, // In case of re-applying same areas
        });
      }
      return user;
    });

    res.status(201).json(excludePassword(newUser));
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    // Check for specific Prisma errors if needed, e.g., P2002 for unique constraint
    if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(400).json({ message: "Uma ou mais áreas fornecidas são inválidas." });
    }
    res.status(500).json({ message: "Erro interno do servidor ao criar usuário." });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        areaAccesses: {
          include: {
            area: true, // Include area details
          },
        },
      },
    });
    res.json(users.map(excludePassword));
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ message: "Erro interno do servidor ao listar usuários." });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        areaAccesses: {
          include: {
            area: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.json(excludePassword(user));
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor ao buscar usuário." });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, role, areas } = req.body;

  try {
    const updateData = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user details
      const user = await tx.user.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
      });

      // 2. Handle area accesses if 'areas' is provided
      // If 'areas' is an empty array, it means remove all accesses.
      // If 'areas' is not provided, don't change existing accesses.
      if (areas !== undefined) {
        // Delete existing area accesses for this user
        await tx.userAreaAccess.deleteMany({
          where: { userId: parseInt(id, 10) },
        });

        // Add new area accesses if any
        if (areas.length > 0) {
          const areaConnections = areas.map((areaId) => ({
            userId: user.id,
            areaId: parseInt(areaId, 10),
          }));
          await tx.userAreaAccess.createMany({
            data: areaConnections,
            skipDuplicates: true,
          });
        }
      }
      return user; // Return the user object from the transaction
    });

    // Fetch the user again to include updated relations for the response
    const userWithRelations = await prisma.user.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            areaAccesses: {
                include: {
                    area: true,
                },
            },
        },
    });

    res.json(excludePassword(userWithRelations));
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    if (error.code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: "Usuário não encontrado para atualização." });
    }
    if (error.code === 'P2002') { // Unique constraint failed (e.g., email already exists)
        return res.status(400).json({ message: "Email já está em uso por outro usuário." });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(400).json({ message: "Uma ou mais áreas fornecidas são inválidas." });
    }
    res.status(500).json({ message: "Erro interno do servidor ao atualizar usuário." });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Prisma will cascade delete UserAreaAccess entries due to schema relations
    await prisma.user.delete({
      where: { id: parseInt(id, 10) },
    });
    res.status(200).json({ message: "Usuário excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    if (error.code === 'P2025') { // Record to delete not found
        return res.status(404).json({ message: "Usuário não encontrado para exclusão." });
    }
    res.status(500).json({ message: "Erro interno do servidor ao excluir usuário." });
  }
};
