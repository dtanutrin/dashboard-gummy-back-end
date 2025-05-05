import { PrismaClient } from '@prisma/client';

// Inicializa o Prisma Client como um singleton
// Isso evita a criação de múltiplas conexões com o banco de dados
const prisma = new PrismaClient();

export default prisma;

