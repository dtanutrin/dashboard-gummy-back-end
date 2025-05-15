# Gummy Dashboards - Backend

Este repositório contém o código-fonte do backend para a aplicação Gummy Dashboards. Ele é responsável por gerenciar a lógica de negócios, autenticação, acesso a dados e fornecer uma API RESTful para o frontend.

## Visão Geral do Projeto

O backend do Gummy Dashboards foi desenvolvido para ser uma solução robusta e segura para o gerenciamento e visualização de dashboards. Ele se integra a um banco de dados PostgreSQL hospedado no Neon Tech e está implantado na plataforma Render.

## ✨ Funcionalidades Principais

O backend oferece um conjunto de funcionalidades essenciais para a operação da plataforma Gummy Dashboards:

*   **Autenticação de Usuários:** Implementa um sistema de login seguro utilizando JSON Web Tokens (JWT) para proteger os endpoints e garantir que apenas usuários autenticados acessem os recursos.
*   **Gerenciamento de Dashboards:** Permite a criação, leitura, atualização e exclusão (CRUD) de dashboards. Administradores possuem controle total, enquanto usuários comuns visualizam dashboards com base em suas permissões de área.
*   **Controle de Acesso Baseado em Funções (RBAC):** Diferencia usuários comuns de administradores, restringindo o acesso a funcionalidades críticas (como criação e exclusão de dashboards) apenas para administradores.
*   **Gerenciamento de Áreas:** Embora a documentação da API mencione que a gestão de áreas não está nos endpoints principais, a estrutura sugere a capacidade de associar dashboards a áreas específicas, controlando o acesso.
*   **API RESTful:** Expõe endpoints bem definidos para que o frontend possa interagir com os dados e funcionalidades do sistema.

## 🔐 Segurança

A segurança é um aspecto crucial do backend do Gummy Dashboards:

*   **Autenticação com JWT:** Todos os endpoints sensíveis são protegidos e requerem um token JWT válido no cabeçalho de autorização (`Bearer <token>`).
*   **Middleware de Autenticação:** O arquivo `middleware/authenticateToken.js` é responsável por verificar a validade dos tokens JWT em cada requisição.
*   **Middleware de Autorização (Admin):** O arquivo `middleware/isAdmin.js` verifica se o usuário autenticado possui a função de administrador, restringindo o acesso a rotas e funcionalidades administrativas.
*   **Validação de Entradas:** Embora não explicitamente detalhado na exploração, espera-se que haja validação dos dados de entrada nos controllers para prevenir vulnerabilidades como injeção de SQL ou XSS.
*   **Hashing de Senhas:** A documentação da API menciona que o hash da senha para novos usuários deve ser gerado no backend, uma prática essencial para a segurança das credenciais.

## 🔗 Integrações

O backend se integra com os seguintes serviços e tecnologias:

*   **Banco de Dados PostgreSQL (Neon Tech):** Utiliza um banco de dados PostgreSQL hospedado na plataforma Neon Tech ([https://neon.tech/](https://neon.tech/)) para persistência dos dados. A string de conexão fornecida (`DATABASE_URL`) indica essa integração.
*   **Prisma ORM:** A pasta `prisma` e o arquivo `schema.prisma` indicam o uso do Prisma como ORM (Object-Relational Mapper) para interagir com o banco de dados de forma segura e eficiente.
*   **Plataforma de Deploy (Render):** O backend está hospedado e acessível publicamente através da plataforma Render ([https://render.com/](https://render.com/)), conforme o link do endpoint fornecido.
*   **Frontend Gummy Dashboards:** O backend serve como a API para o projeto frontend do Gummy Dashboards.

## 🗺️ Estrutura do Projeto e Rotas Principais

O projeto segue uma estrutura modular para organizar o código de forma lógica:

*   **`config/`**: Arquivos de configuração da aplicação.
*   **`controllers/`**: Contêm a lógica de manipulação das requisições HTTP e interação com os serviços. Principais controllers incluem:
    *   `authController.js`: Lógica para autenticação de usuários.
    *   `dashboardController.js`: Lógica para operações CRUD de dashboards.
    *   `userController.js`: Lógica para gerenciamento de usuários (criação, etc. - parcialmente inferido).
    *   `areaController.js` e `areasController.js`: Lógica relacionada a áreas e sua associação com dashboards/usuários.
*   **`middleware/`**: Funções que processam requisições antes de chegarem aos controllers, como `authenticateToken.js` (autenticação) e `isAdmin.js` (verificação de privilégios de administrador).
*   **`prisma/`**: Contém o `schema.prisma` que define o modelo do banco de dados e as migrações.
*   **`routes/`**: Define os endpoints da API e os associa aos respectivos controllers. Principais arquivos de rotas:
    *   `auth.js`: Rotas para login (`/api/auth/login`).
    *   `dashboards.js`: Rotas para CRUD de dashboards (`/api/dashboards`, `/api/dashboards/:id`).
    *   `userRoutes.js` e `users.js`: Rotas para gerenciamento de usuários.
    *   `areaRoutes.js` e `areas.js`: Rotas relacionadas a áreas.
*   **`services/`**: Camada de serviço que encapsula a lógica de negócios mais complexa, como o `dashboardService.js`.
*   **`utils/`**: Funções utilitárias, como `handleValidationErrors.js` para tratamento de erros de validação.
*   **`server.js`**: Ponto de entrada da aplicação, onde o servidor Express é configurado e iniciado.
*   **`API_DOCUMENTATION.md`**: Arquivo Markdown com a documentação detalhada dos endpoints da API.

### Principais Endpoints da API

Uma documentação completa da API está disponível no arquivo [API_DOCUMENTATION.md](API_DOCUMENTATION.md) neste repositório. Alguns dos endpoints chave incluem:

*   **Autenticação:**
    *   `POST /api/auth/login`: Autentica um usuário.
*   **Dashboards:**
    *   `GET /api/dashboards`: Lista dashboards (com base nas permissões do usuário).
    *   `GET /api/dashboards/:id`: Obtém um dashboard específico.
    *   `POST /api/dashboards`: Cria um novo dashboard (Admin).
    *   `PUT /api/dashboards/:id`: Atualiza um dashboard (Admin).
    *   `DELETE /api/dashboards/:id`: Exclui um dashboard (Admin).

## 🛠️ Tecnologias Utilizadas

*   **Node.js:** Ambiente de execução JavaScript no servidor.
*   **Express.js:** Framework web para Node.js, utilizado para construir a API RESTful.
*   **Prisma:** ORM para interagir com o banco de dados PostgreSQL.
*   **PostgreSQL:** Sistema de gerenciamento de banco de dados relacional.
*   **JSON Web Tokens (JWT):** Para autenticação e autorização.
*   **bcrypt.js (inferido):** Para hashing de senhas (prática comum com autenticação).

## 🚀 Deploy

O backend está implantado na plataforma Render e pode ser acessado através do seguinte endpoint:

*   **Endpoint do Backend (Render):** [https://dashboard-gummy-back-end.onrender.com](https://dashboard-gummy-back-end.onrender.com)

O banco de dados está hospedado no Neon Tech:

*   **Neon Tech:** [https://neon.tech/](https://neon.tech/)

## 🔗 Links Úteis

*   **Repositório Frontend:** [https://github.com/dtanutrin/dashboard-gummy-front-end](https://github.com/dtanutrin/dashboard-gummy-front-end)
*   **Aplicação Frontend (Netlify):** [https://dashboardgummy.netlify.app/](https://dashboardgummy.netlify.app/)
*   **Documentação da API deste Backend:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## ⚙️ Configuração e Instalação (Desenvolvimento Local)

1.  Clone o repositório:
    ```bash
    git clone https://github.com/dtanutrin/dashboard-gummy-back-end.git
    cd dashboard-gummy-back-end
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis (substitua pelos seus valores):
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require&schema=your_schema_name"
    JWT_SECRET="seu_segredo_jwt_super_secreto"
    PORT=5000
    ```
    *Nota: Para o `DATABASE_URL`, utilize a string de conexão fornecida pelo Neon Tech ou sua configuração local do PostgreSQL.*

4.  Execute as migrações do Prisma para criar as tabelas no banco de dados:
    ```bash
    npx prisma migrate dev --name init
    ```
    (Ou `npx prisma db push` se preferir sincronizar o schema sem criar um arquivo de migração explícito, dependendo do seu fluxo de trabalho com Prisma).

5.  Inicie o servidor de desenvolvimento:
    ```bash
    npm start
    ```
O servidor estará rodando em `http://localhost:5000` (ou a porta definida em `.env`).

