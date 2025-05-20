// Caminho: /opt/render/project/src/middleware/cors.js
// Middleware especializado para CORS com suporte a preflight OPTIONS

import cors from 'cors';

// Configuração avançada de CORS para resolver problemas de preflight
const corsMiddleware = cors({
  origin: [
    'https://dta-gummy.netlify.app',
    'https://dashboardgummy.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas em segundos - cache para requests preflight
});

// Middleware para tratar especificamente requests OPTIONS
const handleOptions = (req, res, next) => {
  // Se for um request OPTIONS, responder imediatamente com 200
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Se não for OPTIONS, continuar para o próximo middleware
  next();
};

export { corsMiddleware, handleOptions };
