import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Importa helmet
import rateLimit from 'express-rate-limit'; // Importa express-rate-limit
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboards.js';
import userRoutes from './routes/users.js';


dotenv.config();


const app = express();
const port = process.env.PORT || 5000;

// Middlewares de Segurança Essenciais
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(cors()); // Habilita CORS (ajuste as opções se necessário para produção)
app.set("trust proxy", 1); // Confia no primeiro proxy (adequado para o Render)


// Middleware de Limitação de Taxa (Rate Limiting) - Geral
// Aplica a todas as requisições. Pode ser configurado por rota se necessário.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requisições por janela (windowMs)
  standardHeaders: true, // Retorna informações do limite nos cabeçalhos `RateLimit-*`
  legacyHeaders: false, // Desabilita os cabeçalhos `X-RateLimit-*` (legados)
  message: 'Muitas requisições enviadas deste IP, por favor tente novamente após 15 minutos.',
});
app.use(limiter);

// Middlewares Gerais
app.use(express.json()); // Habilita o parsing de JSON

// Rotas (CORRIGIDO - removido o .js dos caminhos)
app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('Backend Gummy Dashboards está rodando!');
});

// Middleware de tratamento de erros (exemplo básico)
// Deve ser adicionado após as rotas
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado no servidor!');
});

app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});
app.use('/api/users', userRoutes);