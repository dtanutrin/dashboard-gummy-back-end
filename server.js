// Caminho: /opt/render/project/src/server.js
// Arquivo modificado para resolver problema de CORS
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboards.js';
import userRoutes from './routes/users.js';
import areaRoutes from './routes/areaRoutes.js';
import { corsMiddleware, handleOptions } from './middleware/cors.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Aplicar middleware de CORS personalizado ANTES de qualquer outro middleware
app.use(handleOptions);
app.use(corsMiddleware);

// Outros middlewares de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições enviadas deste IP, por favor tente novamente após 15 minutos.',
});
app.use(limiter);

app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);

app.get('/', (req, res) => {
  res.send('Backend Gummy Dashboards está rodando!');
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Algo deu errado no servidor!' });
});

app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});
