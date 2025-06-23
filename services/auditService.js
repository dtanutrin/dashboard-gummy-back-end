import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AuditService = {
  async createLog(logData) {
    try {
      if (process.env.AUDIT_ENABLED !== 'true') {
        return null;
      }
  
      // ✅ Função para limpar dados circulares
      const sanitizeData = (obj, maxDepth = 3, currentDepth = 0) => {
        if (currentDepth >= maxDepth || obj === null || obj === undefined) {
          return obj;
        }
        
        if (typeof obj !== 'object') {
          return obj;
        }
        
        if (Array.isArray(obj)) {
          return obj.slice(0, 10).map(item => sanitizeData(item, maxDepth, currentDepth + 1));
        }
        
        const sanitized = {};
        const keys = Object.keys(obj).slice(0, 20); // Limitar número de propriedades
        
        for (const key of keys) {
          try {
            if (key === 'password' || key === 'token') continue; // Pular dados sensíveis
            sanitized[key] = sanitizeData(obj[key], maxDepth, currentDepth + 1);
          } catch (error) {
            sanitized[key] = '[Circular Reference]';
          }
        }
        
        return sanitized;
      };
  
      // ✅ Função para converter string para int de forma segura
      const safeParseInt = (value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      };
  
      // ✅ Adaptar para o schema existente com dados sanitizados e tipos corretos
      const auditData = {
        action: logData.action,
        entityType: logData.entityType || logData.tableName || 'UNKNOWN',
        entityId: safeParseInt(logData.entityId || logData.recordId), // ✅ Converter para int
        userId: safeParseInt(logData.userId), // ✅ Converter para int
        adminId: safeParseInt(logData.adminId), // ✅ Converter para int
        level: logData.level || 'info',
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null,
        details: {
          oldData: sanitizeData(logData.oldData),
          newData: sanitizeData(logData.newData),
          additionalInfo: sanitizeData(logData.additionalInfo)
        }
      };
  
      // ✅ Validar tamanho dos dados antes de salvar
      const dataSize = JSON.stringify(auditData.details).length;
      if (dataSize > 50000) { // 50KB limit
        auditData.details = {
          error: 'Dados muito grandes para auditoria',
          size: dataSize,
          summary: {
            action: logData.action,
            entityType: auditData.entityType,
            userId: auditData.userId
          }
        };
      }
  
      const log = await prisma.auditLog.create({
        data: auditData
      });
  
      return log;
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
      // ✅ Log simplificado em caso de erro
      try {
        await prisma.auditLog.create({
          data: {
            action: logData.action || 'ERROR',
            entityType: 'SYSTEM',
            level: 'error',
            details: {
              error: 'Falha ao criar log completo',
              originalError: error.message
            }
          }
        });
      } catch (fallbackError) {
        console.error('Erro crítico na auditoria:', fallbackError);
      }
      return null;
    }
  },

  async getLogs(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        entityType,
        userId,
        startDate,
        endDate
      } = filters;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      const where = {};
      
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;
      if (userId) where.userId = parseInt(userId);
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take
        }),
        prisma.auditLog.count({ where })
      ]);

      // ✅ Buscar dados dos usuários separadamente
      const userIds = [...new Set(logs.flatMap(log => [log.userId, log.adminId].filter(Boolean)))];
      
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      });

      // ✅ Mapear usuários por ID para acesso rápido
      const userMap = users.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {});

      // ✅ Transformar logs para incluir informações completas do usuário
      const logsWithCompleteUserInfo = logs.map(log => {
        const user = log.userId ? userMap[log.userId] : null;
        const admin = log.adminId ? userMap[log.adminId] : null;
        
        return {
          id: log.id,
          timestamp: log.timestamp,
          level: log.level || 'info',
          message: log.action, // Usar action como message por enquanto
          userId: log.userId,
          userEmail: user?.email || null,
          userName: user?.name || null,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email
          } : null,
          admin: admin ? {
            id: admin.id,
            name: admin.name,
            email: admin.email
          } : null,
          action: log.action,
          resource: log.entityType, // entityType como resource
          details: log.details,
          ip: log.ipAddress,
          userAgent: log.userAgent,
          // Campos originais mantidos para compatibilidade
          entityType: log.entityType,
          entityId: log.entityId,
          adminId: log.adminId
        };
      });

      return {
        logs: logsWithCompleteUserInfo,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / take),
          totalItems: total,
          itemsPerPage: take
        }
      };
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  },

  async getStats(filters = {}) {
    try {
      const { startDate, endDate } = filters;
      
      const where = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const [totalLogs, actionStats, entityStats] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true }
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: { entityType: true }
        })
      ]);

      const actionStatsObj = {};
      actionStats.forEach(stat => {
        actionStatsObj[stat.action] = stat._count.action;
      });

      const entityStatsObj = {};
      entityStats.forEach(stat => {
        entityStatsObj[stat.entityType] = stat._count.entityType;
      });

      return {
        totalLogs,
        actionStats: actionStatsObj,
        entityStats: entityStatsObj
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  // Função modificada para limpeza de logs recentes (últimos X dias)
  async cleanOldLogs(olderThanDays) {
    try {
      if (process.env.AUDIT_ENABLED !== 'true') {
        return { deleted: 0, message: 'Auditoria desabilitada' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // MUDANÇA: usar 'gte' em vez de 'lt' para apagar logs RECENTES
      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            gte: cutoffDate  // Apaga logs dos últimos X dias
          }
        }
      });

      // REMOVER esta linha:
      // console.log(`Limpeza de auditoria: ${result.count} logs removidos (últimos ${olderThanDays} dias)`);

      return { 
        deleted: result.count, 
        cutoffDate: cutoffDate.toISOString(),
        message: `${result.count} logs dos últimos ${olderThanDays} dias removidos com sucesso`
      };
    } catch (error) {
      console.error('Erro na limpeza de logs:', error);
      throw error;
    }
  }
};

export default AuditService;
