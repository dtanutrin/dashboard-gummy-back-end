
// Caminho: /opt/render/project/src/middleware/auth.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Erro: JWT_SECRET não está definido no arquivo .env");
  process.exit(1);
}

// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (token == null) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido.' }); // Não autorizado
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expirado.' }); // Proibido
      }
      return res.status(403).json({ message: 'Token inválido.' }); // Proibido
    }
    
    // Anexa as informações do usuário decodificadas à requisição
    req.user = user;
    next();
  });
};

// Middleware para verificar se o usuário é administrador
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }
  
  // Verificação mais robusta: garantir que req.user.role existe e fazer comparação case-insensitive
  if (!req.user.role || (req.user.role.toUpperCase() !== 'ADMIN')) {
    console.log('Acesso negado. Role do usuário:', req.user.role);
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  
  next();
};

export { authenticateToken, isAdmin };
