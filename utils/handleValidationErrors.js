import { validationResult } from 'express-validator';

// Middleware para lidar com erros de validação do express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retorna um erro 400 (Bad Request) com os detalhes da validação
    return res.status(400).json({ errors: errors.array() });
  }
  // Se não houver erros, passa para o próximo middleware ou rota
  next();
};

export default handleValidationErrors;

