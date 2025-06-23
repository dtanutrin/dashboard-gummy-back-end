/* eslint-disable no-console */
import * as DashboardService from "../services/dashboardService.js";
import prisma from "../config/prisma.js";
import AuditService from '../services/auditService.js';

// Função auxiliar para formatar a resposta do dashboard
const formatDashboardResponse = (dashboard) => ({
  id: dashboard.id,
  name: dashboard.name,
  url: dashboard.url,
  information: dashboard.information || null,
  areaId: dashboard.areaId,
  areaName: dashboard.area?.name || null,
  createdAt: dashboard.createdAt,
  updatedAt: dashboard.updatedAt,
});

// Função auxiliar para verificar acesso ao dashboard
const checkDashboardAccess = async (userId, dashboardId, userRole) => {
  if (userRole === "Admin") {
    return true;
  }

  // Buscar o dashboard para obter a área
  const dashboard = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    select: { areaId: true }
  });

  if (!dashboard) {
    return false;
  }

  // Verificar acesso à área
  const areaAccess = await prisma.userAreaAccess.findUnique({
    where: {
      userId_areaId: {
        userId: userId,
        areaId: dashboard.areaId,
      },
    },
  });

  if (!areaAccess) {
    return false;
  }

  // Verificar acesso específico ao dashboard
  const dashboardAccess = await prisma.userDashboardAccess.findUnique({
    where: {
      userId_dashboardId: {
        userId: userId,
        dashboardId: dashboardId,
      },
    },
  });

  return !!dashboardAccess;
};

// Controller para LISTAR dashboards com controle granular
export const listDashboards = async (req, res, next) => {
  try {
    const user = req.user;
    let dashboards;

    if (user.role === "Admin") {
      dashboards = await DashboardService.getAllDashboards();
    } else {
      // Buscar dashboards com acesso específico
      const userDashboardAccesses = await prisma.userDashboardAccess.findMany({
        where: { userId: user.userId },
        include: {
          dashboard: {
            include: {
              area: true
            }
          }
        }
      });

      dashboards = userDashboardAccesses.map(access => access.dashboard);
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

    // Verificar acesso usando a nova lógica granular
    const hasAccess = await checkDashboardAccess(user.userId, dashboardId, user.role);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Acesso negado a este dashboard." });
    }

    res.json(formatDashboardResponse(dashboard));
  } catch (error) {
    console.error("Erro no controller ao obter dashboard por ID:", error);
    next(error);
  }
};

// Controller para ADICIONAR um novo dashboard
export const addDashboard = async (req, res, next) => {
  const { name, url, areaId, information } = req.body; // Adicionado o campo information

  try {
    // A verificação de areaExists pode ser movida para o service se desejado,
    // mas para manter a lógica do controller mais explícita por enquanto:
    const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
    if (!areaExists) {
      return res.status(400).json({ message: "Área especificada não existe." });
    }

    const newDashboard = await DashboardService.createDashboard({ name, url, areaId, information }); // Adicionado o campo information
    res.status(201).json(formatDashboardResponse(newDashboard));
  } catch (error) {
    console.error("Erro no controller ao adicionar dashboard:", error);
    next(error);
  }
};

// Controller para ATUALIZAR um dashboard existente
export const updateDashboard = async (req, res, next) => {
  const dashboardId = parseInt(req.params.id);
  const { name, url, areaId, information } = req.body; // Adicionado o campo information

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

    const updatedDashboard = await DashboardService.updateDashboard(dashboardId, { name, url, areaId, information }); // Adicionado o campo information
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

// Novo controller para conceder acesso a dashboard
export const grantDashboardAccess = async (req, res, next) => {
  const { userId, dashboardId } = req.body;
  const grantedBy = req.user.userId;

  try {
    // Verificar se o usuário e dashboard existem
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const dashboard = await prisma.dashboard.findUnique({ where: { id: dashboardId } });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (!dashboard) {
      return res.status(404).json({ message: "Dashboard não encontrado." });
    }

    // Verificar se o usuário tem acesso à área do dashboard
    const areaAccess = await prisma.userAreaAccess.findUnique({
      where: {
        userId_areaId: {
          userId: userId,
          areaId: dashboard.areaId,
        },
      },
    });

    if (!areaAccess) {
      return res.status(400).json({ 
        message: "Usuário deve ter acesso à área antes de receber acesso ao dashboard." 
      });
    }

    // Criar ou atualizar o acesso ao dashboard
    const dashboardAccess = await prisma.userDashboardAccess.upsert({
      where: {
        userId_dashboardId: {
          userId: userId,
          dashboardId: dashboardId,
        },
      },
      update: {
        grantedBy: grantedBy,
        grantedAt: new Date(),
      },
      create: {
        userId: userId,
        dashboardId: dashboardId,
        grantedBy: grantedBy,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        dashboard: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      message: "Acesso ao dashboard concedido com sucesso.",
      access: dashboardAccess,
    });
  } catch (error) {
    console.error("Erro ao conceder acesso ao dashboard:", error);
    next(error);
  }
};

// Novo controller para revogar acesso a dashboard
export const revokeDashboardAccess = async (req, res, next) => {
  const { userId, dashboardId } = req.body;

  try {
    const deletedAccess = await prisma.userDashboardAccess.delete({
      where: {
        userId_dashboardId: {
          userId: userId,
          dashboardId: dashboardId,
        },
      },
    });

    res.json({
      message: "Acesso ao dashboard revogado com sucesso.",
      deletedAccess,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Acesso não encontrado." });
    }
    console.error("Erro ao revogar acesso ao dashboard:", error);
    next(error);
  }
};

// Novo controller para listar acessos de um usuário
export const getUserDashboardAccesses = async (req, res, next) => {
  const userId = parseInt(req.params.userId);

  try {
    const accesses = await prisma.userDashboardAccess.findMany({
      where: { userId: userId },
      include: {
        dashboard: {
          include: {
            area: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    res.json(accesses);
  } catch (error) {
    console.error("Erro ao buscar acessos do usuário:", error);
    next(error);
  }
};

// Novo controller para rastrear acesso a dashboard
export const trackDashboardAccess = async (req, res, next) => {
  const dashboardId = parseInt(req.params.id);
  const user = req.user;

  try {
    // Verificar se o dashboard existe
    const dashboard = await DashboardService.getDashboardById(dashboardId);
    
    if (!dashboard) {
      return res.status(404).json({ message: "Dashboard não encontrado." });
    }

    // Verificar se o usuário tem acesso ao dashboard
    const hasAccess = await checkDashboardAccess(user.userId, dashboardId, user.role);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Acesso negado a este dashboard." });
    }

    // Registrar o acesso no log de auditoria
    await AuditService.createLog({
      action: 'DASHBOARD_ACCESS',
      entityType: 'dashboards',
      entityId: dashboardId,
      userId: user.userId,
      level: 'info',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      additionalInfo: {
        userName: user.name,
        userEmail: user.email,
        dashboardName: dashboard.name,
        dashboardUrl: dashboard.url,
        areaName: dashboard.area?.name,
        accessedAt: new Date().toISOString()
      }
    });

    res.json({ 
      message: "Acesso ao dashboard registrado com sucesso.",
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        url: dashboard.url
      },
      user: {
        id: user.userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Erro ao rastrear acesso ao dashboard:", error);
    next(error);
  }
};
