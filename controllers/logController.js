import { validationResult } from 'express-validator';
import AuditService from '../services/auditService.js';

// Listar logs com filtros
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      userId,
      adminId,
      startDate,
      endDate
    } = req.query;

    const result = await AuditService.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      entityType,
      userId: userId ? parseInt(userId) : null,
      adminId: adminId ? parseInt(adminId) : null,
      startDate,
      endDate
    });

    res.json({
      logs: result.logs,
      total: result.pagination.totalItems
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Estatísticas de logs
const getLogStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await AuditService.getStats(parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Exportar logs em CSV com informações completas
const exportLogs = async (req, res) => {
  try {
    const {
      action,
      entityType,
      userId,
      adminId,
      startDate,
      endDate
    } = req.query;

    const result = await AuditService.getLogs({
      page: 1,
      limit: 10000,
      action,
      entityType,
      userId: userId ? parseInt(userId) : null,
      adminId: adminId ? parseInt(adminId) : null,
      startDate,
      endDate
    });

    // ✅ Função para escapar valores CSV corretamente
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      
      // Converter para string
      let stringValue = String(value);
      
      // Remover quebras de linha e caracteres de controle
      stringValue = stringValue.replace(/[\r\n\t]/g, ' ');
      
      // Se contém vírgula, aspas ou espaços, envolver em aspas duplas
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        // Escapar aspas duplas duplicando-as
        stringValue = stringValue.replace(/"/g, '""');
        return `"${stringValue}"`;
      }
      
      return stringValue;
    };

    // ✅ Função para formatar detalhes JSON de forma segura
    const formatDetails = (details) => {
      if (!details || typeof details !== 'object') {
        return '';
      }
      
      try {
        // Criar versão simplificada dos detalhes para CSV
        const simplifiedDetails = {
          oldData: details.oldData ? 'Dados anteriores disponíveis' : null,
          newData: details.newData ? 'Novos dados disponíveis' : null,
          additionalInfo: details.additionalInfo || null,
          reason: details.reason || null,
          timestamp: details.timestamp || null
        };
        
        // Remover campos nulos
        Object.keys(simplifiedDetails).forEach(key => {
          if (simplifiedDetails[key] === null || simplifiedDetails[key] === undefined) {
            delete simplifiedDetails[key];
          }
        });
        
        return JSON.stringify(simplifiedDetails).replace(/[\r\n\t]/g, ' ');
      } catch (error) {
        return 'Erro ao processar detalhes';
      }
    };

    // ✅ Função para formatar data de forma legível
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      try {
        return new Date(timestamp).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        return String(timestamp);
      }
    };

    // ✅ CSV com cabeçalho em português e formatação correta
    const csvHeader = 'ID,Ação,Recurso,ID da Entidade,Nome do Usuário,Email do Usuário,Admin,IP,Data/Hora,Detalhes\n';
    
    const csvRows = result.logs.map(log => {
      const row = [
        escapeCsvValue(log.id),
        escapeCsvValue(log.action),
        escapeCsvValue(log.resource || log.entityType),
        escapeCsvValue(log.entityId),
        escapeCsvValue(log.userName),
        escapeCsvValue(log.userEmail),
        escapeCsvValue(log.admin?.name),
        escapeCsvValue(log.ip),
        escapeCsvValue(formatDate(log.timestamp)),
        escapeCsvValue(formatDetails(log.details))
      ];
      
      return row.join(',');
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    // ✅ Configurar headers corretos para UTF-8
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // ✅ Adicionar BOM para UTF-8 (ajuda com Excel)
    const csvWithBOM = '\uFEFF' + csv;
    
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Nova função para limpar logs antigos
const cleanOldLogs = async (req, res) => {
  try {
    const { olderThanDays } = req.query;
    
    // Validação
    if (!olderThanDays || isNaN(olderThanDays) || olderThanDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro olderThanDays deve ser um número maior que 0'
      });
    }

    const days = parseInt(olderThanDays);
    
    // Proteção: não permitir limpeza de logs muito recentes
    if (days < 7) {
      return res.status(400).json({
        success: false,
        message: 'Por segurança, não é possível limpar logs com menos de 7 dias'
      });
    }

    const result = await AuditService.cleanOldLogs(days);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Nova função para limpar logs por período
const cleanLogsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros startDate e endDate são obrigatórios'
      });
    }

    const result = await AuditService.cleanLogsByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao limpar logs por período:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export {
  getLogs,
  getLogStats,
  exportLogs,
  cleanOldLogs,
  cleanLogsByDateRange  // Nova função
};
