import prisma from "../config/prisma.js";

export const listAreas = async (req, res, next) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(areas);
  } catch (error) {
    console.error("Erro no controller ao listar áreas:", error);
    next(error);
  }
};
