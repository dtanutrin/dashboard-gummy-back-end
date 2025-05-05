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
    next(); // Passa para a próxima rota ou middleware
  });
};

export default authenticateToken;

