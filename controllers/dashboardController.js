import prisma from '../config/prisma.js'; // Importa a instância singleton do Prisma

// Função auxiliar para formatar a resposta do dashboard
const formatDashboardResponse = (dashboard) => ({
  id: dashboard.id,
  name: dashboard.name,
  url: dashboard.url,
  areaId: dashboard.areaId,
  areaName: dashboard.area?.name || null, // Acesso seguro caso a área não seja incluída
  createdAt: dashboard.createdAt,
  updatedAt: dashboard.updatedAt,
});

// Controller para LISTAR dashboards
export const listDashboards = async (req, res, next) => {
  try {
    const user = req.user; // Informações do usuário vêm do middleware authenticateToken
    let dashboards;

    const queryOptions = {
      include: {
        area: { // Inclui o nome da área relacionada
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        areaId: 'asc', // Ordena por área e depois por nome
        name: 'asc',
      },
    };

    if (user.role === 'Admin') {
      // Admin vê todos os dashboards
      dashboards = await prisma.dashboard.findMany(queryOptions);
    } else {
      // Usuário comum: buscar as áreas permitidas
      const userAccess = await prisma.userAreaAccess.findMany({
        where: { userId: user.userId },
        select: { areaId: true },
      });
      const allowedAreaIds = userAccess.map(access => access.areaId);

      // Buscar dashboards apenas das áreas permitidas
      dashboards = await prisma.dashboard.findMany({
        ...queryOptions,
        where: {
          areaId: {
            in: allowedAreaIds,
          },
        },
      });
    }

    // Formata a resposta
    const formattedDashboards = dashboards.map(formatDashboardResponse);
    res.json(formattedDashboards);

  } catch (error) {
    console.error('Erro no controller ao listar dashboards:', error);
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

// Controller para OBTER um dashboard específico por ID
export const getDashboardById = async (req, res, next) => {
  // A validação do ID (isNumeric) será feita na rota
  const dashboardId = parseInt(req.params.id);
  const user = req.user;

  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: { area: { select: { name: true } } },
    });

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard não encontrado.' });
    }

    // Verifica permissão (Admin tem acesso a tudo)
    if (user.role !== 'Admin') {
      const userAccess = await prisma.userAreaAccess.findUnique({
        where: {
          userId_areaId: {
            userId: user.userId,
            areaId: dashboard.areaId,
          },
        },
      });
      if (!userAccess) {
        // Retorna 403 Forbidden se o usuário não tiver acesso à área do dashboard
        return res.status(403).json({ message: 'Acesso negado a este dashboard.' });
      }
    }

    // Formata e retorna o dashboard
    res.json(formatDashboardResponse(dashboard));

  } catch (error) {
    console.error('Erro no controller ao obter dashboard por ID:', error);
    next(error);
  }
};

// Controller para ADICIONAR um novo dashboard
export const addDashboard = async (req, res, next) => {
  // A validação (nome, url, areaId) já foi feita pelo middleware na rota
  const { name, url, areaId } = req.body;

  try {
    // Verifica se a área existe (redundante se a validação na rota já faz isso, mas seguro)
    const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
    if (!areaExists) {
      // Embora a validação da rota deva pegar isso, é uma checagem extra
      return res.status(400).json({ message: 'Área especificada não existe.' });
    }

    const newDashboard = await prisma.dashboard.create({
      data: {
        name,
        url,
        areaId,
      },
      include: { area: { select: { name: true } } }, // Inclui a área para formatação
    });

    // Retorna 201 Created com o dashboard formatado
    res.status(201).json(formatDashboardResponse(newDashboard));

  } catch (error) {
    console.error('Erro no controller ao adicionar dashboard:', error);
    // TODO: Verificar erros específicos do Prisma (ex: constraint violation)
    next(error);
  }
};

// Controller para ATUALIZAR um dashboard existente
export const updateDashboard = async (req, res, next) => {
  // Validação do ID (rota) e do corpo (rota) já ocorreram
  const dashboardId = parseInt(req.params.id);
  const { name, url, areaId } = req.body;

  try {
    // Verifica se a área existe (redundante, mas seguro)
    const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
    if (!areaExists) {
      return res.status(400).json({ message: 'Área especificada não existe.' });
    }

    const updatedDashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: {
        name,
        url,
        areaId,
      },
      include: { area: { select: { name: true } } }, // Inclui a área para formatação
    });

    // Retorna o dashboard atualizado e formatado
    res.json(formatDashboardResponse(updatedDashboard));

  } catch (error) {
    console.error('Erro no controller ao atualizar dashboard:', error);
    if (error.code === 'P2025') { // Código de erro do Prisma para registro não encontrado
      return res.status(404).json({ message: 'Dashboard não encontrado para atualização.' });
    }
    next(error);
  }
};

// Controller para EXCLUIR um dashboard
export const deleteDashboard = async (req, res, next) => {
  // Validação do ID (rota) já ocorreu
  const dashboardId = parseInt(req.params.id);

  try {
    await prisma.dashboard.delete({
      where: { id: dashboardId },
    });

    // Retorna 204 No Content em caso de sucesso
    res.status(204).send();

  } catch (error) {
    console.error('Erro no controller ao excluir dashboard:', error);
    if (error.code === 'P2025') { // Código de erro do Prisma para registro não encontrado
      return res.status(404).json({ message: 'Dashboard não encontrado para exclusão.' });
    }
    next(error);
  }
};

