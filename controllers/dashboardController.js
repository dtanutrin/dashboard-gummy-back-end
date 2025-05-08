/* eslint-disable no-console */
import * as DashboardService from "../services/dashboardService.js";
import prisma from "../config/prisma.js"; // Ainda necessário para userAreaAccess

// Função auxiliar para formatar a resposta do dashboard
const formatDashboardResponse = (dashboard) => ({
  id: dashboard.id,
  name: dashboard.name,
  url: dashboard.url,
  areaId: dashboard.areaId,
  areaName: dashboard.area?.name || null,
  createdAt: dashboard.createdAt,
  updatedAt: dashboard.updatedAt,
});

// Controller para LISTAR dashboards
export const listDashboards = async (req, res, next) => {
  try {
    const user = req.user;
    let dashboards;

    if (user.role === "Admin") {
      dashboards = await DashboardService.getAllDashboards();
    } else {
      const userAccess = await prisma.userAreaAccess.findMany({
        where: { userId: user.userId },
        select: { areaId: true },
      });
      const allowedAreaIds = userAccess.map(access => access.areaId);

      // A lógica de filtragem por allowedAreaIds ainda precisa ser feita no service ou aqui.
      // Por enquanto, para manter a lógica de negócio inalterada, faremos um getAll e filtraremos depois,
      // ou ajustamos o service para aceitar allowedAreaIds.
      // Para simplificar e não alterar a lógica de negócio AGORA, vamos manter a busca e filtro aqui.
      const allDashboards = await DashboardService.getAllDashboards();
      dashboards = allDashboards.filter(d => allowedAreaIds.includes(d.areaId));
    }

    const formattedDashboards = dashboards.map(formatDashboardResponse);
    res.json(formattedDashboards);

  } catch (error) {
    console.error("Erro no controller ao listar dashboards:", error);
    next(error);
  }
};

// Controller para OBTER um dashboard específico por ID
export const getDashboardById = async (req, res, next) => {
  const dashboardId = parseInt(req.params.id);
  const user = req.user;

  try {
    const dashboard = await DashboardService.getDashboardById(dashboardId);

    if (!dashboard) {
      return res.status(404).json({ message: "Dashboard não encontrado." });
    }

    if (user.role !== "Admin") {
      const userAccess = await prisma.userAreaAccess.findUnique({
        where: {
          userId_areaId: { // Corrigido para o nome do campo composto no schema
            userId: user.userId,
            areaId: dashboard.areaId,
          },
        },
      });
      if (!userAccess) {
        return res.status(403).json({ message: "Acesso negado a este dashboard." });
      }
    }

    res.json(formatDashboardResponse(dashboard));
  } catch (error) {
    console.error("Erro no controller ao obter dashboard por ID:", error);
    next(error);
  }
};

// Controller para ADICIONAR um novo dashboard
export const addDashboard = async (req, res, next) => {
  const { name, url, areaId } = req.body;

  try {
    // A verificação de areaExists pode ser movida para o service se desejado,
    // mas para manter a lógica do controller mais explícita por enquanto:
    const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
    if (!areaExists) {
      return res.status(400).json({ message: "Área especificada não existe." });
    }

    const newDashboard = await DashboardService.createDashboard({ name, url, areaId });
    res.status(201).json(formatDashboardResponse(newDashboard));
  } catch (error) {
    console.error("Erro no controller ao adicionar dashboard:", error);
    next(error);
  }
};

// Controller para ATUALIZAR um dashboard existente
export const updateDashboard = async (req, res, next) => {
  const dashboardId = parseInt(req.params.id);
  const { name, url, areaId } = req.body;

  try {
    const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
    if (!areaExists) {
      return res.status(400).json({ message: "Área especificada não existe." });
    }
    // Verificar se o dashboard existe antes de atualizar pode ser uma boa prática no service.
    const dashboardToUpdate = await DashboardService.getDashboardById(dashboardId);
    if (!dashboardToUpdate) {
        return res.status(404).json({ message: "Dashboard não encontrado para atualização." });
    }

    const updatedDashboard = await DashboardService.updateDashboard(dashboardId, { name, url, areaId });
    res.json(formatDashboardResponse(updatedDashboard));
  } catch (error) {
    console.error("Erro no controller ao atualizar dashboard:", error);
    // O service já pode ter tratado P2025, mas uma checagem dupla não faz mal.
    if (error.code === "P2025") { 
      return res.status(404).json({ message: "Dashboard não encontrado para atualização." });
    }
    next(error);
  }
};

// Controller para EXCLUIR um dashboard
export const deleteDashboard = async (req, res, next) => {
  const dashboardId = parseInt(req.params.id);

  try {
    // Verificar se o dashboard existe antes de deletar pode ser uma boa prática no service.
    const dashboardToDelete = await DashboardService.getDashboardById(dashboardId);
    if (!dashboardToDelete) {
        return res.status(404).json({ message: "Dashboard não encontrado para exclusão." });
    }
    await DashboardService.deleteDashboard(dashboardId);
    res.status(204).send();
  } catch (error) {
    console.error("Erro no controller ao excluir dashboard:", error);
    if (error.code === "P2025") { 
      return res.status(404).json({ message: "Dashboard não encontrado para exclusão." });
    }
    next(error);
  }
};

