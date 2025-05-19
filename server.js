import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboards.js';
import userRoutes from './routes/users.js';
import areaRoutes from './routes/areaRoutes.js'; // Corrigido para o nome do arquivo correto

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
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

app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes); // Rota de áreas registrada

app.get('/', (req, res) => {
  res.send('Backend Gummy Dashboards está rodando!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Algo deu errado no servidor!' });
});

app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});

