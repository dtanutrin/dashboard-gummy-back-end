import AuditService from '../services/auditService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Middleware para capturar dados da requisição (MANTER APENAS UMA DECLARAÇÃO)
const captureAuditData = (req, res, next) => {
  // Capturar IP do cliente (considerando proxies)
  const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           'unknown';
  };

  // Capturar dados de auditoria
  req.auditData = {
    userId: req.user?.userId || null,
    userName: req.user?.name || null, // ← Adicionar o nome do usuário
    adminId: req.user?.role === 'admin' ? req.user.userId : null,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'] || null,
    entityType: getEntityTypeFromRoute(req.path),
    route: req.path,
    method: req.method,
    timestamp: new Date()
  };

  next();
};

// Função para mapear rotas para tipos de entidade
const getEntityTypeFromRoute = (path) => {
  if (path.includes('/auth/')) return 'AUTH';
  if (path.includes('/user')) return 'USER';
  if (path.includes('/dashboard')) return 'DASHBOARD';
  if (path.includes('/area')) return 'AREA';
  if (path.includes('/log')) return 'LOG';
  return 'SYSTEM';
};

// ✅ Função helper simplificada para evitar recursão
let isLogging = false;

const logAction = async (action, details = {}, overrideUserId = null) => {
  // Prevenir recursão
  if (isLogging) {
    console.log('Prevenindo recursão na auditoria');
    return;
  }
  
  // REMOVER estas linhas que causam o erro:
  // if (req.skipAudit) {
  //   return next();
  // }
  
  isLogging = true;
  
  try {
    if (process.env.AUDIT_ENABLED !== 'true') return;

    const logData = {
      action,
      level: details.level || 'info',
      entityType: details.entityType || 'SYSTEM',
      entityId: details.entityId || null,
      userId: overrideUserId || details.userId || null,
      adminId: details.adminId || null,
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || null,
      oldData: details.oldData || null,
      newData: details.newData || null,
      additionalInfo: {
        route: details.route,
        method: details.method,
        userName: details.userName || null,
        timestamp: new Date().toISOString(),
        ...details.additionalInfo
      }
    };

    await AuditService.createLog(logData);
  } catch (error) {
    console.error('Erro ao registrar ação de auditoria:', error);
  } finally {
    isLogging = false;
  }
};

// Middleware específico para login
const auditLogin = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (res.statusCode === 200 && responseData.success !== false) {
        // Login bem-sucedido
        const userId = responseData.user?.id;
        const isAdmin = responseData.user?.role === 'admin';
        
        logAction('LOGIN_SUCCESS', {
          level: 'info',
          entityType: 'AUTH',
          userId: userId,
          adminId: isAdmin ? userId : null,
          ipAddress: req.auditData?.ipAddress || 'unknown',
          userAgent: req.auditData?.userAgent,
          additionalInfo: {
            email: responseData.user?.email,
            role: responseData.user?.role,
            reason: 'Login realizado com sucesso'
          },
          newData: {
            email: responseData.user?.email,
            role: responseData.user?.role
          }
        }, userId);
      } else {
        // Login falhado
        logAction('LOGIN_FAILED', {
          level: 'warn',
          entityType: 'AUTH',
          ipAddress: req.auditData?.ipAddress || 'unknown',
          userAgent: req.auditData?.userAgent,
          additionalInfo: {
            email: req.body?.email,
            reason: 'Falha na autenticação - credenciais inválidas'
          }
        });
      }
    } catch (error) {
      console.error('Erro no middleware de auditoria de login:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware para operações CRUD com nomenclatura melhorada
const auditCRUD = (entityType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action;
        let entityId = null;
        let details = {};
        let level = 'info';
        let reason = '';
        let responseData = null; // ← Declarar responseData aqui
        
        switch (req.method) {
          case 'POST':
            action = `${entityType}_CREATED`;
            level = 'info';
            reason = `${entityType} criado com sucesso`;
            try {
              responseData = JSON.parse(data); // ← Usar a variável já declarada
              entityId = responseData.id || responseData.data?.id;
              details = { created: responseData };
            } catch (e) {
              responseData = data; // ← Fallback se não conseguir fazer parse
            }
            break;
            
          case 'PUT':
          case 'PATCH':
            action = `${entityType}_UPDATED`;
            level = 'info';
            reason = `${entityType} atualizado com sucesso`;
            entityId = req.params.id;
            details = { updated: req.body };
            try {
              responseData = JSON.parse(data); // ← Adicionar para PUT/PATCH também
            } catch (e) {
              responseData = data;
            }
            break;
            
          case 'DELETE':
            action = `${entityType}_DELETED`;
            level = 'warn';
            reason = `${entityType} removido do sistema`;
            entityId = req.params.id;
            details = { deleted: true };
            try {
              responseData = JSON.parse(data); // ← Adicionar para DELETE também
            } catch (e) {
              responseData = data;
            }
            break;
            
          default:
            originalSend.call(this, data);
            return;
        }
        
        logAction(action, {
          ...details,
          level,
          entityType,
          entityId,
          userId: req.auditData?.userId,
          userName: req.auditData?.userName,
          adminId: req.auditData?.adminId,
          ipAddress: req.auditData?.ipAddress,
          userAgent: req.auditData?.userAgent,
          oldData: req.auditData?.oldData,
          newData: responseData, // ← Agora responseData está definido
          additionalInfo: {
            route: req.auditData?.route,
            method: req.auditData?.method,
            reason
          }
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Exportações ES modules
export {
  captureAuditData,
  auditLogin,
  auditCRUD,
  logAction
};