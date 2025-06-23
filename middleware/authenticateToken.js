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
  // REMOVER todas estas linhas de debug:
  // console.log('🔍 [DEBUG] authenticateToken middleware executado');
  // console.log('🔍 [DEBUG] Headers recebidos:', req.headers);
  
  const authHeader = req.headers['authorization'];
  // console.log('🔍 [DEBUG] authHeader:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  // console.log('🔍 [DEBUG] token extraído:', token ? 'Token presente' : 'Token ausente');
  
  if (!token) {
    // console.log('🚨 [DEBUG] Token não fornecido');
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // console.log('🚨 [DEBUG] Erro na verificação do token:', err.message);
      return res.status(403).json({ 
        message: 'Token inválido',
        error: err.message 
      });
    }
    
    // console.log('✅ [DEBUG] Token válido, usuário decodificado:', user);
    // console.log('✅ [DEBUG] req.user será definido como:', user);
    req.user = user;
    next();
  });
};

export default authenticateToken;

