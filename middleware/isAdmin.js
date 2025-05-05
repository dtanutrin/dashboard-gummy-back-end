// Middleware para verificar se o usuário é Administrador
const isAdmin = (req, res, next) => {
  // Este middleware deve ser usado *depois* do authenticateToken
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' }); // Proibido
  }
  next(); // Usuário é Admin, pode prosseguir
};

export default isAdmin;

