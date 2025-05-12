import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Importa helmet
import rateLimit from 'express-rate-limit'; // Importa express-rate-limit
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboards.js';
import userRoutes from './routes/users.js';
import areaRoutes from './routes/areas.js'; // Adicionada a rota de áreas

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares de Segurança Essenciais
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(cors()); // Habilita CORS (ajuste as opções se necessário para produção)
app.set("trust proxy", 1); // Confia no primeiro proxy (adequado para o Render)

// Middleware de Limitação de Taxa (Rate Limiting) - Geral
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Aumentado para permitir mais requisições durante o desenvolvimento/teste
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições enviadas deste IP, por favor tente novamente após 15 minutos.',
});
app.use(limiter);

// Middlewares Gerais
app.use(express.json()); // Habilita o parsing de JSON

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes); // Registrada a rota de áreas

// Rota de teste
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