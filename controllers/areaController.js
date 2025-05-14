import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Criar uma nova Área (Apenas Admin)
export const createArea = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "O nome da área é obrigatório." });
  }
  try {
    const existingArea = await prisma.area.findUnique({
      where: { name },
    });
    if (existingArea) {
      return res.status(400).json({ error: "Uma área com este nome já existe." });
    }
    const area = await prisma.area.create({
      data: { name },
    });
    res.status(201).json(area);
  } catch (error) {
    console.error("Erro ao criar área:", error);
    res.status(500).json({ error: "Erro interno do servidor ao criar área." });
  }
};

// Obter todas as Áreas com seus Dashboards (Filtrado por permissão)
export const getAllAreas = async (req, res) => {
  const user = req.user; // Injetado pelo authenticateToken
  try {
    let areas;
    if (user.role === "Admin") {
      areas = await prisma.area.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          dashboards: true,
        },
      });
    } else {
      const userAreaAccesses = await prisma.userAreaAccess.findMany({
        where: { userId: user.userId },
        select: { areaId: true },
      });
      const allowedAreaIds = userAreaAccesses.map(access => access.areaId);
      if (allowedAreaIds.length === 0) {
        return res.json([]); // Retorna array vazio se não tem acesso a nenhuma área
      }
      areas = await prisma.area.findMany({
        where: {
          id: { in: allowedAreaIds },
        },
        orderBy: {
          name: "asc",
        },
        include: {
          dashboards: true,
        },
      });
    }
    res.json(areas);
  } catch (error) {
    console.error("Erro ao buscar áreas com dashboards:", error);
    res.status(500).json({ error: "Erro interno do servidor ao buscar áreas." });
  }
};

// Obter uma Área por ID com seus Dashboards (Filtrado por permissão)
export const getAreaById = async (req, res) => {
  const { id } = req.params;
  const user = req.user; // Injetado pelo authenticateToken
  try {
    const areaId = parseInt(id);
    if (user.role !== "Admin") {
      const access = await prisma.userAreaAccess.findUnique({
        where: {
          userId_areaId: {
            userId: user.userId,
            areaId: areaId,
          },
        },
      });
      if (!access) {
        return res.status(403).json({ error: "Acesso negado a esta área." });
      }
    }

    const area = await prisma.area.findUnique({
      where: { id: areaId },
      include: {
        dashboards: true,
      },
    });

    if (!area) {
      return res.status(404).json({ error: "Área não encontrada." });
    }
    res.json(area);
  } catch (error) {
    console.error("Erro ao buscar área por ID com dashboards:", error);
    res.status(500).json({ error: "Erro interno do servidor ao buscar área." });
  }
};

// Atualizar uma Área (Apenas Admin)
export const updateArea = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "O nome da área é obrigatório para atualização." });
  }
  try {
    const existingAreaWithName = await prisma.area.findFirst({
        where: {
            name: name,
            NOT: {
                id: parseInt(id)
            }
        }
    });
    if (existingAreaWithName) {
        return res.status(400).json({ error: "Já existe outra área com este nome." });
    }

    const area = await prisma.area.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(area);
  } catch (error) {
    if (error.code === "P2025") { 
      return res.status(404).json({ error: "Área não encontrada para atualização." });
    }
    console.error("Erro ao atualizar área:", error);
    res.status(500).json({ error: "Erro interno do servidor ao atualizar área." });
  }
};

// Deletar uma Área (Apenas Admin)
export const deleteArea = async (req, res) => {
  const { id } = req.params;
  try {
    const dashboardsCount = await prisma.dashboard.count({
      where: { areaId: parseInt(id) },
    });

    if (dashboardsCount > 0) {
      return res.status(400).json({ 
        error: "Não é possível excluir a área pois existem dashboards associados a ela. Remova os dashboards primeiro."
      });
    }

    const userAccessCount = await prisma.userAreaAccess.count({
        where: { areaId: parseInt(id) },
    });

    if (userAccessCount > 0) {
        // Antes de impedir, vamos remover os acessos para permitir a exclusão da área
        await prisma.userAreaAccess.deleteMany({
            where: { areaId: parseInt(id) },
        });
    }

    await prisma.area.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Área não encontrada para exclusão." });
    }
    console.error("Erro ao deletar área:", error);
    res.status(500).json({ error: "Erro interno do servidor ao deletar área." });
  }
};

