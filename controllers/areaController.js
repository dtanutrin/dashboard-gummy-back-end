const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Criar uma nova Área
exports.createArea = async (req, res) => {
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

// Obter todas as Áreas com seus Dashboards
exports.getAllAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        dashboards: true, // Inclui os dashboards associados a cada área
      },
    });
    res.json(areas);
  } catch (error) {
    console.error("Erro ao buscar áreas com dashboards:", error);
    res.status(500).json({ error: "Erro interno do servidor ao buscar áreas." });
  }
};

// Obter uma Área por ID com seus Dashboards
exports.getAreaById = async (req, res) => {
  const { id } = req.params;
  try {
    const area = await prisma.area.findUnique({
      where: { id: parseInt(id) },
      include: {
        dashboards: true, // Inclui os dashboards associados
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

// Atualizar uma Área
exports.updateArea = async (req, res) => {
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

// Deletar uma Área
exports.deleteArea = async (req, res) => {
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
        return res.status(400).json({ 
          error: "Não é possível excluir a área pois existem usuários com acesso a ela. Remova os acessos primeiro."
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

