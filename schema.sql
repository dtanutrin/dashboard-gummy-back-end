-- Script SQL para criar o schema no PostgreSQL

-- Tabela para armazenar as áreas/setores da empresa
CREATE TABLE IF NOT EXISTS "Areas" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar os usuários
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL DEFAULT 'User', -- Pode ser 'Admin' ou 'User'
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar os dashboards
CREATE TABLE IF NOT EXISTS "Dashboards" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "url" TEXT NOT NULL, -- Armazena a URL completa do dashboard Power BI
  "area_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("area_id") REFERENCES "Areas"("id") ON DELETE CASCADE
);

-- Tabela para associar usuários às áreas que eles têm acesso (permissões)
-- Administradores (definidos pelo campo 'role' na tabela Users) terão acesso a todas as áreas implicitamente via lógica do backend.
-- Usuários comuns terão acesso apenas às áreas listadas nesta tabela para eles.
CREATE TABLE IF NOT EXISTS "UserAreaAccess" (
  "user_id" INTEGER NOT NULL,
  "area_id" INTEGER NOT NULL,
  PRIMARY KEY ("user_id", "area_id"),
  FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("area_id") REFERENCES "Areas"("id") ON DELETE CASCADE
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_dashboards_area_id ON "Dashboards"("area_id");
CREATE INDEX IF NOT EXISTS idx_userareaaccess_user_id ON "UserAreaAccess"("user_id");
CREATE INDEX IF NOT EXISTS idx_userareaaccess_area_id ON "UserAreaAccess"("area_id");

-- Função para atualizar o campo updated_at automaticamente (opcional, mas boa prática)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para chamar a função update_updated_at_column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_areas_updated_at') THEN
    CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON "Areas"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dashboards_updated_at') THEN
    CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON "Dashboards"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Inserir áreas iniciais (Exemplo)
INSERT INTO "Areas" ("name") VALUES
('Logística'),
('Marketing'),
('Operações'),
('CS'),
('Comercial')
ON CONFLICT ("name") DO NOTHING;

-- Inserir usuário Admin inicial (Exemplo - A senha deve ser hashada no backend antes de inserir)
-- Exemplo: senha 'admin123' hashada com bcrypt
-- INSERT INTO "Users" ("email", "password_hash", "role") VALUES
-- ('admin@example.com', '$2b$10$abcdefghijklmnopqrstuv', 'Admin')
-- ON CONFLICT ("email") DO NOTHING;


