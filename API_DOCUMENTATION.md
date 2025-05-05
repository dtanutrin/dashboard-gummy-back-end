# Documentação da API - Backend Gummy Dashboards

Esta documentação descreve os endpoints da API RESTful criada para o projeto Gummy Dashboards.

**URL Base:** `http://localhost:5000` (ou a URL onde o backend for hospedado)

**Autenticação:** A maioria dos endpoints requer autenticação via JSON Web Token (JWT). O token deve ser enviado no cabeçalho `Authorization` como `Bearer <seu_token_jwt>`.

---

## 1. Autenticação (`/api/auth`)

### 1.1 Login de Usuário

- **Endpoint:** `POST /api/auth/login`
- **Descrição:** Autentica um usuário com base no email e senha.
- **Autenticação:** Nenhuma.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "email": "usuario@example.com",
    "password": "senha123"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "message": "Login bem-sucedido!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Token JWT
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "role": "User" // ou "Admin"
    }
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: Email ou senha não fornecidos.
  - `401 Unauthorized`: Credenciais inválidas (email não encontrado ou senha incorreta).
  - `500 Internal Server Error`: Erro no servidor.

---

## 2. Dashboards (`/api/dashboards`)

### 2.1 Listar Dashboards

- **Endpoint:** `GET /api/dashboards`
- **Descrição:** Retorna uma lista de dashboards. Administradores veem todos os dashboards. Usuários comuns veem apenas os dashboards das áreas às quais têm acesso.
- **Autenticação:** Requerida (Token JWT).
- **Resposta de Sucesso (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Desempenho de Entregas",
      "url": "https://app.powerbi.com/view?r=...",
      "areaId": 1,
      "areaName": "Logística",
      "createdAt": "2025-04-29T17:20:00.000Z",
      "updatedAt": "2025-04-29T17:20:00.000Z"
    },
    // ... outros dashboards
  ]
  ```
- **Respostas de Erro:**
  - `401 Unauthorized`: Token não fornecido.
  - `403 Forbidden`: Token inválido ou expirado.
  - `500 Internal Server Error`: Erro no servidor.

### 2.2 Obter Dashboard Específico

- **Endpoint:** `GET /api/dashboards/:id`
- **Descrição:** Retorna os detalhes de um dashboard específico pelo seu ID.
- **Autenticação:** Requerida (Token JWT).
- **Parâmetros de URL:**
  - `id` (Integer): ID do dashboard.
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "id": 1,
    "name": "Desempenho de Entregas",
    "url": "https://app.powerbi.com/view?r=...",
    "areaId": 1,
    "areaName": "Logística",
    "createdAt": "2025-04-29T17:20:00.000Z",
    "updatedAt": "2025-04-29T17:20:00.000Z"
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: ID inválido.
  - `401 Unauthorized`: Token não fornecido.
  - `403 Forbidden`: Token inválido, expirado ou usuário sem acesso à área do dashboard.
  - `404 Not Found`: Dashboard não encontrado.
  - `500 Internal Server Error`: Erro no servidor.

### 2.3 Adicionar Novo Dashboard

- **Endpoint:** `POST /api/dashboards`
- **Descrição:** Cria um novo dashboard. **Requer privilégios de Administrador.**
- **Autenticação:** Requerida (Token JWT).
- **Autorização:** Apenas `Admin`.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "name": "Novo Dashboard de Vendas",
    "url": "https://app.powerbi.com/view?r=novoid",
    "areaId": 5 // ID da área "Comercial"
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "id": 12,
    "name": "Novo Dashboard de Vendas",
    "url": "https://app.powerbi.com/view?r=novoid",
    "areaId": 5,
    "areaName": "Comercial",
    "createdAt": "2025-04-29T17:25:00.000Z",
    "updatedAt": "2025-04-29T17:25:00.000Z"
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: Dados inválidos (campos faltando, URL inválida, área não existe).
  - `401 Unauthorized`: Token não fornecido.
  - `403 Forbidden`: Token inválido, expirado ou usuário não é Admin.
  - `500 Internal Server Error`: Erro no servidor.

### 2.4 Atualizar Dashboard Existente

- **Endpoint:** `PUT /api/dashboards/:id`
- **Descrição:** Atualiza os detalhes de um dashboard existente. **Requer privilégios de Administrador.**
- **Autenticação:** Requerida (Token JWT).
- **Autorização:** Apenas `Admin`.
- **Parâmetros de URL:**
  - `id` (Integer): ID do dashboard a ser atualizado.
- **Corpo da Requisição (JSON):**
  ```json
  {
    "name": "Dashboard de Vendas Atualizado",
    "url": "https://app.powerbi.com/view?r=urlatualizada",
    "areaId": 5
  }
  ```
- **Resposta de Sucesso (200 OK):** Retorna o objeto do dashboard atualizado (similar à resposta do POST).
- **Respostas de Erro:**
  - `400 Bad Request`: ID inválido ou dados inválidos (campos faltando, URL inválida, área não existe).
  - `401 Unauthorized`: Token não fornecido.
  - `403 Forbidden`: Token inválido, expirado ou usuário não é Admin.
  - `404 Not Found`: Dashboard não encontrado.
  - `500 Internal Server Error`: Erro no servidor.

### 2.5 Excluir Dashboard

- **Endpoint:** `DELETE /api/dashboards/:id`
- **Descrição:** Exclui um dashboard existente. **Requer privilégios de Administrador.**
- **Autenticação:** Requerida (Token JWT).
- **Autorização:** Apenas `Admin`.
- **Parâmetros de URL:**
  - `id` (Integer): ID do dashboard a ser excluído.
- **Resposta de Sucesso (204 No Content):** Nenhuma resposta no corpo.
- **Respostas de Erro:**
  - `400 Bad Request`: ID inválido.
  - `401 Unauthorized`: Token não fornecido.
  - `403 Forbidden`: Token inválido, expirado ou usuário não é Admin.
  - `404 Not Found`: Dashboard não encontrado.
  - `500 Internal Server Error`: Erro no servidor.

---

**Observações:**

- A gestão de usuários (criação, atribuição de áreas) e áreas não foi incluída nestes endpoints e precisaria ser implementada separadamente (provavelmente com rotas `/api/users` e `/api/areas` protegidas para Admin) ou gerenciada diretamente no banco de dados.
- O hash da senha para novos usuários deve ser gerado no backend antes de salvar no banco.
- Considere adicionar paginação à rota `GET /api/dashboards` se o número de dashboards for muito grande.

