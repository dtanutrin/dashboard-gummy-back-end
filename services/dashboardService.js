import prisma from '../config/prisma.js';

export const getAllDashboards = async () => {
  return await prisma.dashboard.findMany({
    include: {
      area: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ areaId: 'asc' }, { name: 'asc' }],
  });
};

export const getDashboardById = async (id) => {
  return await prisma.dashboard.findUnique({
    where: { id },
    include: {
      area: { select: { name: true } },
    },
  });
};

export const createDashboard = async (data) => {
  return await prisma.dashboard.create({
    data,
    include: { area: { select: { name: true } } },
  });
};

export const updateDashboard = async (id, data) => {
  return await prisma.dashboard.update({
    where: { id },
    data,
    include: { area: { select: { name: true } } },
  });
};

export const deleteDashboard = async (id) => {
  return await prisma.dashboard.delete({ where: { id } });
};
